import { db } from "#/bootstrap/database";
import { SQL } from "drizzle-orm";

class QueryHelper {
  /**
   * List raw query helper
   * @param query
   * @returns
   */
  async rawList<T>(query: SQL): Promise<T[]> {
    try {
      const result = await db.execute(query);
      return (result.rows as T[]) || [];
    } catch (err) {
      throw err;
    }
  }

  /**
   * Raw query helper
   * @param query
   * @returns
   */
  async raw<T>(query: SQL): Promise<T | null> {
    try {
      const result = await db.execute(query);
      if (result.rows && result.rows.length > 0) {
        return result.rows[0] as T;
      }
      return null;
    } catch (err) {
      throw err;
    }
  }
}

export const queryHelper = new QueryHelper();
