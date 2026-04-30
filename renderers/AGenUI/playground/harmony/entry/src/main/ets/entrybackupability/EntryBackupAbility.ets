import { hilog } from '@kit.PerformanceAnalysisKit';
import { BackupExtensionAbility, BundleVersion } from '@kit.CoreFileKit';

const DOMAIN = 0x0000;

export default class EntryBackupAbility extends BackupExtensionAbility {
  async onBackup(): Promise<void> {
    hilog.info(DOMAIN, 'testTag', 'onBackup ok');
  }

  async onRestore(bundleVersion: BundleVersion): Promise<void> {
    hilog.info(DOMAIN, 'testTag', 'onRestore ok %{public}s', JSON.stringify(bundleVersion));
  }
}