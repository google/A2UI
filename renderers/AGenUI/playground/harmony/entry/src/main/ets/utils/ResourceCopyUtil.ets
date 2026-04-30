import { Context } from '@kit.AbilityKit';
import { hilog } from '@kit.PerformanceAnalysisKit';
import { fileIo as fs } from '@kit.CoreFileKit';

const DOMAIN = 0x0000;
const TAG = 'ResourceCopyUtil';

/**
 * Copies every file under a rawfile directory into the app sandbox.
 *
 * @param context Ability context used to access resourceManager and filesDir
 * @param rawfileDir Source directory name under rawfile, for example `ui_templates`
 * @param sandboxSubDir Target subdirectory in the sandbox, for example `data/ui_templates`.
 * Defaults to `rawfileDir`.
 * @returns Absolute sandbox path of the copied target directory
 */
export async function copyRawfileDirToSandbox(
  context: Context,
  rawfileDir: string,
  sandboxSubDir?: string
): Promise<string> {
  const resourceManager = context.resourceManager;
  const targetSubDir = sandboxSubDir ?? rawfileDir;
  const sandboxTargetDir = `${context.filesDir}/${targetSubDir}`;

  // Ensure the target directory exists, creating nested segments as needed.
  const parts = targetSubDir.split('/');
  let buildPath = context.filesDir;
  for (const part of parts) {
    if (part.length === 0) {
      continue;
    }
    buildPath = `${buildPath}/${part}`;
    if (!fs.accessSync(buildPath)) {
      fs.mkdirSync(buildPath);
      hilog.info(DOMAIN, TAG, 'Created sandbox directory: %{public}s', buildPath);
    }
  }

  // Read the file list under the rawfile directory.
  const fileList: string[] = resourceManager.getRawFileListSync(rawfileDir);
  hilog.info(DOMAIN, TAG, 'Found %{public}d files in rawfile/%{public}s', fileList.length, rawfileDir);

  for (const fileName of fileList) {
    const rawfilePath = `${rawfileDir}/${fileName}`;
    const sandboxFilePath = `${sandboxTargetDir}/${fileName}`;

    try {
      // Read the rawfile content.
      const rawfileContent: Uint8Array = resourceManager.getRawFileContentSync(rawfilePath);

      // Write the file into the sandbox target path.
      const file = fs.openSync(sandboxFilePath, fs.OpenMode.CREATE | fs.OpenMode.TRUNC | fs.OpenMode.WRITE_ONLY);
      fs.writeSync(file.fd, rawfileContent.buffer);
      fs.closeSync(file);

      hilog.info(DOMAIN, TAG, 'Copied: %{public}s -> %{public}s', rawfilePath, sandboxFilePath);
    } catch (err) {
      hilog.error(DOMAIN, TAG, 'Failed to copy file %{public}s: %{public}s', rawfilePath, JSON.stringify(err));
    }
  }

  hilog.info(DOMAIN, TAG, 'All files copied to sandbox: %{public}s', sandboxTargetDir);
  return sandboxTargetDir;
}
