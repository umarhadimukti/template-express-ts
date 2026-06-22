import { db } from "#/bootstrap/database";
import { SQL } from "drizzle-orm";

class QueryHelper {
  /**
   * validation function that allow select statement only
   */
  static async validateSelectStatement(query: SQL): Promise<void> {
    let sqlString = "";
    try {
      if (typeof (query as any).toSQL === "function") {
        sqlString = (query as any).toSQL().sql ?? String(query);
      } else if (typeof (query as any).sql === "string") {
        sqlString = (query as any).sql;
      } else {
        sqlString = String(query);
      }
    } catch (e) {
      sqlString = String(query);
    }

    if (!/^\s*select\b/i.test(sqlString)) {
      throw new Error("Only SELECT statements are allowed");
    }
  }

  /**
   * list raw query helper
   * @param query
   * @returns Promise<T[]>
   */
  static async rawList<T>(query: SQL): Promise<T[]> {
    await this.validateSelectStatement(query);
    const result = db
      .execute(query)
      .then((res) => (res.rows as T[]) || [])
      .catch((err) => {
        throw err;
      });
    return result;
  }

  /**
   * raw query helper
   * @param query
   * @returns Promise<T | null>
   */
  static async raw<T>(query: SQL): Promise<T | null> {
    await this.validateSelectStatement(query);
    const result = db
      .execute(query)
      .then((res) => (res.rows[0] as T) ?? null)
      .catch((err) => {
        throw err;
      });
    return result;
  }
}

export const queryHelper = new QueryHelper();
