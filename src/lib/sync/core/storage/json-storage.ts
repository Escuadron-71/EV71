import fs from "fs/promises";
import path from "path";
import { type DomainEvent, type SyncResult } from "../types/domain-events";

export interface StorageOptions {
  dataDir: string;
  latestFilename: string;
  historyDir: string;
  backupEnabled: boolean;
}

export class JsonStorage {
  private options: StorageOptions;

  constructor(options?: Partial<StorageOptions>) {
    this.options = {
      dataDir: "data/events",
      latestFilename: "latest.json",
      historyDir: "history",
      backupEnabled: true,
      ...options,
    };
  }

  /**
   * Guarda eventos en JSON
   */
  async saveEvents(
    events: DomainEvent[],
    syncResult: SyncResult,
  ): Promise<string> {
    const dataDir = this.options.dataDir;
    await this.ensureDirectory(dataDir);

    // Guardar archivo más reciente
    const latestPath = path.join(dataDir, this.options.latestFilename);
    const data = JSON.stringify(syncResult, null, 2);
    await fs.writeFile(latestPath, data, "utf-8");

    // Guardar backup con timestamp
    if (this.options.backupEnabled) {
      const historyDir = path.join(dataDir, this.options.historyDir);
      await this.ensureDirectory(historyDir);

      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const backupPath = path.join(historyDir, `${timestamp}.json`);
      await fs.writeFile(backupPath, data, "utf-8");
    }

    return latestPath;
  }

  /**
   * Lee los eventos más recientes
   */
  async readLatestEvents(): Promise<SyncResult | null> {
    const latestPath = path.join(
      this.options.dataDir,
      this.options.latestFilename,
    );

    try {
      const data = await fs.readFile(latestPath, "utf-8");
      return JSON.parse(data) as SyncResult;
    } catch (error) {
      if (
        error instanceof Error &&
        "code" in error &&
        error.code === "ENOENT"
      ) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Asegura que el directorio existe
   */
  private async ensureDirectory(dir: string): Promise<void> {
    try {
      await fs.mkdir(dir, { recursive: true });
    } catch (error) {
      if (
        error instanceof Error &&
        "code" in error &&
        error.code !== "EEXIST"
      ) {
        throw error;
      }
    }
  }
}
