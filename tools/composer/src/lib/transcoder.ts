export function transpileToV0_8(msg: any): any {
  if (msg.createSurface) {
    return {
      beginRendering: {
        surfaceId: msg.createSurface.surfaceId,
        root: "root",
        styles: {}
      }
    };
  }
  if (msg.updateComponents) {
    return {
      surfaceUpdate: {
        surfaceId: msg.updateComponents.surfaceId,
        components: msg.updateComponents.components
      }
    };
  }
  if (msg.updateDataModel) {
    return {
      dataModelUpdate: {
        surfaceId: msg.updateDataModel.surfaceId,
        path: msg.updateDataModel.path || '/',
        contents: msg.updateDataModel.contents
      }
    };
  }
  if (msg.deleteSurface) {
    return {
      deleteSurface: {
        surfaceId: msg.deleteSurface.surfaceId
      }
    };
  }
  return msg;
}
