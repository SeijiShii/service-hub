import type { AnyDb } from "../db/index.js";
import { listServices } from "../db/index.js";
import type { ServiceDescriptor } from "../types/index.js";

export interface ValidationError {
  slug?: string;
  message: string;
}

/**
 * レジストリ SoT (Neon `services` テーブル、D20260528-001) からサービス一覧を取得する。
 * 旧 services.toml + toml パース (validateServicesToml) は退役 (DB 一本化, D20260528-005)。
 * 書き込み経路の検証は serviceDescriptorSchema (schema.ts) を直接使う (admin write, Phase 3)。
 */
export async function loadServices(
  db: AnyDb,
  opts: { onlyActive?: boolean } = {},
): Promise<ServiceDescriptor[]> {
  return listServices(db, opts);
}
