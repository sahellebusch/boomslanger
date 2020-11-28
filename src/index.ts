import { camelizeKeys, decamelize } from 'humps';
import isPlainObject from 'lodash.isplainobject';
import Pgp, { IDatabase, IMain, Column } from 'pg-promise';

interface BoomslingerOpts {
  /**
   * Database connection string.
   */
  postgresUrl: string;

  /**
   * Prints all SQL statements for easier debugging.
   */
  debug?: boolean;
}

/**
 * Boomslinger.
 *
 * @constructor
 */
export default class Boomslinger {
  private readonly pgp: IMain<{}>;
  private readonly connection: IDatabase<{}>;

  constructor(opts: BoomslingerOpts) {
    const pgpOpts: any = {
      capSQL: true,
    };

    if (opts.debug) {
      pgpOpts.query = (q: any) => console.log(q.query); // eslint-disable-line no-console
    }

    this.pgp = Pgp(pgpOpts);
    this.connection = this.pgp(opts.postgresUrl);
  }

  /**
   * Closes the connection.
   */
  close(): void {
    this.pgp.end();
  }

  /**
   * Injects a single object into the database.
   *
   * @param table - table name to insert the object
   * @param data  - the object to be inserted
   */
  async injectOne<T = Record<any, any>>(table: string, data: T): Promise<T> {
    const columns = this.getColumns(data);
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

  /**
   * Injects many of the same object into the database.
   *
   * @param table - table name to insert the object
   * @param data  - the array of objects to be inserted
   */
  async injectMany<T = Record<any, any>>(
    table: string,
    data: T[]
  ): Promise<T[]> {
    const columns = this.getColumns(data[0]);
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

  /**
   * Truncates a table and restarts identity.
   */
  async truncateTable(table: string): Promise<void> {
    await this.connection.none(`TRUNCATE ${table} RESTART IDENTITY CASCADE`);
  }

  /**
   * @internal
   */
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
