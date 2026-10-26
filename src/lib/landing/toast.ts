// landing: stand-in for `sonner`, which the landing does not install. The
// copied app components only call `toast.error` on a failed write, and the
// landing's write shims never fail.
export const toast = {
  error: (message: string): void => {
    console.error(message);
  },
  success: (message: string): void => {
    void message;
  },
};
