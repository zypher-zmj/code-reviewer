Promise.newAllSettled = (arr) => {
  let result = [];
  return new Promise((res, rej) => {
    arr.forEach((val) => {
      Promise.resolve(val)
        .then((data) => {
          result.push({ status: "fullFilled", val: data });
        })
        .catch((err) => {
          result.push({ status: "rejected", val: err });
        });
      if (result.length === arr.length) {
        res(result);
      }
    });
  });
};


Promise.nAllSettled = (arr) => {
  let result = [];
  return new Promise((res, rej) => {
    arr.forEach((val) => {
      Promise.resolve(val)
        .then((data) => {
          result.push({ status: "fullFilled", val: data });
        })
        .catch((err) => {
          result.push({ status: "rejected", val: err });
        });
      if (result.length === arr.length) {
        res(result);
      }
    });
  });
};


