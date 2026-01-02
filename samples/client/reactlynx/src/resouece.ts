export function createResource(mockFn: Promise<any>): () => any {
  console.log("createResource start");
  let status = "pending";
  let result: any;
  let error: any;

  // 执行模拟API请求
  const promise = mockFn
    .then((res) => {
      status = "success";
      console.info("success", res);
      result = res;
    })
    .catch((err) => {
      status = "error";
      console.error("error", err);
      error = err;
    });

  return () => {
    console.log("res status", status);
    switch (status) {
      case "pending":
        throw promise;
      case "error":
        throw error;
      case "success":
        return result;
      default:
        throw new Error("未知状态");
    }
  };
}
