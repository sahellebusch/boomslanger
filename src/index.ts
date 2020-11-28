import { camelizeKeys, decamelize } from 'humps';
import isPlainObject from 'lodash.isplainobject';
import Pgp, { IDatabase, IMain, Column } from 'pg-promise';

interface BoomslangerOpts {
  postgresUrl: string;
  debug?: boolean;
}

export default class Boomslanger {
  private pgp: IMain<{}>;
  private connection: IDatabase<{}>;

  constructor(opts: BoomslangerOpts) {
    const pgpOpts: any = {
      capSQL: true,
    };

    if (opts.debug) {
      pgpOpts.query = (q: any) => console.log(q.query); // eslint-disable-line no-console
    }

    this.pgp = Pgp(pgpOpts);
    this.connection = this.pgp(opts.postgresUrl);
  }

  close(): void {
    this.pgp.end();
  }

  async injectOne<T = Record<any, any>>(table: string, data: T): Promise<T> {
    const columns = this.getColumns(Array.isArray(data) ? data[0] : data);
    const columnSet = new this.pgp.helpers.ColumnSet(columns, {
      table: decamelize(table),
    });

    const sql = `${this.pgp.helpers.insert(
      <object>(<unknown>data),
      columnSet
    )} RETURNING *`;

    const insertResult = await this.connection.any(sql); // XPromise is of type Promise in pg-promise
    return <T>(<unknown>camelizeKeys(insertResult[0]));
  }

  async injectMany<T = Record<any, any>>(
    table: string,
    data: T[]
  ): Promise<T[]> {
    const columns = this.getColumns(Array.isArray(data) ? data[0] : data);
    const columnSet = new this.pgp.helpers.ColumnSet(columns, {
      table: decamelize(table),
    });

    const sql = `${this.pgp.helpers.insert(
      <object[]>(<unknown>data),
      columnSet
    )} RETURNING *`;

    const insertResult = await this.connection.any(sql); // XPromise is of type Promise in pg-promise
    return insertResult.map<T>(item => <T>(<unknown>camelizeKeys(item)));
  }

  async truncateTable(table: string): Promise<void> {
    await this.connection.none(`TRUNCATE ${table} RESTART IDENTITY CASCADE`);
  }

  private getColumns(sample: Record<any, any>): Column[] {
    return Object.keys(sample).map<Column>(key => {
      const config = {
        name: decamelize(key),
        prop: key,
      };

      if (isPlainObject(sample[key]) || Array.isArray(sample[key])) {
        return new this.pgp.helpers.Column({
          ...config,
          mod: ':json',
        });
      }

      return new this.pgp.helpers.Column(config);
    });
  }
}
