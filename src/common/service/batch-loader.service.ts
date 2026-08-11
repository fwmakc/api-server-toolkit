import { EntityManager, EntityMetadata, In } from 'typeorm';

interface RelationTreeNode {
  [key: string]: {
    relation: any;
    children: RelationTreeNode;
  };
}

function buildRelationTree(
  paths: string[],
  metadata: EntityMetadata,
): RelationTreeNode {
  const root: RelationTreeNode = {};

  for (const path of paths) {
    const segments = path.split('.');
    let currentMeta = metadata;
    let currentLevel = root;

    for (const seg of segments) {
      if (!currentLevel[seg]) {
        const rel = currentMeta.relations.find(
          (r) => r.propertyName === seg,
        );
        if (!rel) break;
        currentLevel[seg] = { relation: rel, children: {} };
      }
      currentMeta = currentLevel[seg].relation.inverseEntityMetadata;
      currentLevel = currentLevel[seg].children;
    }
  }
  return root;
}

function placeholders(n: number): string {
  return Array.from({ length: n }, (_, i) => `$${i + 1}`).join(',');
}

async function batchLoadLevel(
  entities: any[],
  tree: RelationTreeNode,
  manager: EntityManager,
): Promise<void> {
  for (const [propName, node] of Object.entries(tree)) {
    const rel = node.relation;
    const target = rel.inverseEntityMetadata.target;
    const repo = manager.getRepository(target);
    let loaded: any[] = [];

    if (rel.relationType === 'one-to-many') {
      const invRel = rel.inverseRelation;
      const fkCol = invRel?.joinColumns?.[0]?.databaseName;
      const refProp =
        invRel?.joinColumns?.[0]?.referencedColumn?.propertyName || 'id';
      if (!fkCol) continue;

      const parentValues = entities.map((e) => e[refProp]).filter((v) => v != null);
      if (parentValues.length === 0) continue;

      const result = await repo
        .createQueryBuilder('t')
        .where(`t."${fkCol}" IN (:...vals)`, { vals: parentValues })
        .getRawAndEntities();

      loaded = result.entities;

      const rawFkKey = `t_${fkCol}`;
      const byParent = new Map<any, any[]>();
      for (let i = 0; i < result.entities.length; i++) {
        const fkVal = result.raw[i][rawFkKey];
        if (!byParent.has(fkVal)) byParent.set(fkVal, []);
        byParent.get(fkVal)!.push(result.entities[i]);
      }
      for (const entity of entities) {
        entity[propName] = byParent.get(entity[refProp]) || [];
      }
    } else if (
      rel.relationType === 'many-to-one' ||
      rel.relationType === 'one-to-one'
    ) {
      const jc = rel.joinColumns?.[0];
      const fkCol = jc?.databaseName;
      const refProp = jc?.referencedColumn?.propertyName || 'id';
      if (!fkCol) continue;

      const sourceTable = rel.entityMetadata.tableName;
      const parentIds = entities.map((e) => e.id);

      const fkRows = await manager.query(
        `SELECT id, "${fkCol}" AS fk FROM "${sourceTable}" WHERE id IN (${placeholders(parentIds.length)})`,
        parentIds,
      );

      const fkMap = new Map<any, any>();
      for (const row of fkRows) {
        fkMap.set(row.id, row.fk);
      }

      const targetKeys = [
        ...new Set(fkRows.map((r: any) => r.fk).filter((v: any) => v != null)),
      ];
      if (targetKeys.length === 0) {
        for (const entity of entities) entity[propName] = null;
        continue;
      }

      loaded = await repo.find({
        where: { [refProp]: In(targetKeys) } as any,
      });

      const targetMap = new Map(loaded.map((t) => [t[refProp], t]));
      for (const entity of entities) {
        const fk = fkMap.get(entity.id);
        entity[propName] = fk ? targetMap.get(fk) || null : null;
      }
    } else if (rel.relationType === 'many-to-many') {
      const parentIds = entities.map((e) => e.id);
      if (parentIds.length === 0) continue;

      const joinTable = rel.joinTableName;
      const owning = rel.isOwning;
      const cols = owning
        ? rel.joinColumns
        : rel.inverseRelation?.joinColumns;
      const invCols = owning
        ? rel.inverseJoinColumns
        : rel.inverseRelation?.inverseJoinColumns;

      const thisFk = cols?.[0]?.databaseName;
      const otherFk = invCols?.[0]?.databaseName;
      const otherRefProp =
        invCols?.[0]?.referencedColumn?.propertyName || 'id';
      if (!thisFk || !otherFk) continue;

      const rows = await manager.query(
        `SELECT "${thisFk}" AS pid, "${otherFk}" AS cid FROM "${joinTable}" WHERE "${thisFk}" IN (${placeholders(parentIds.length)})`,
        parentIds,
      );

      const childKeys = [...new Set(rows.map((r: any) => r.cid))];
      if (childKeys.length === 0) {
        for (const entity of entities) entity[propName] = [];
        continue;
      }

      loaded = await repo.find({
        where: { [otherRefProp]: In(childKeys) } as any,
      });

      const childMap = new Map(loaded.map((t) => [t[otherRefProp], t]));
      const byParent = new Map<any, any[]>();
      for (const row of rows) {
        if (!byParent.has(row.pid)) byParent.set(row.pid, []);
        const child = childMap.get(row.cid);
        if (child) byParent.get(row.pid)!.push(child);
      }
      for (const entity of entities) {
        entity[propName] = byParent.get(entity.id) || [];
      }
    }

    if (
      node.children &&
      Object.keys(node.children).length > 0 &&
      loaded.length > 0
    ) {
      await batchLoadLevel(loaded, node.children, manager);
    }
  }
}

export async function batchLoadRelations(
  entities: any[],
  relationPaths: string[],
  metadata: EntityMetadata,
  manager: EntityManager,
): Promise<void> {
  if (entities.length === 0 || relationPaths.length === 0) return;
  const tree = buildRelationTree(relationPaths, metadata);
  await batchLoadLevel(entities, tree, manager);
}
