import reactToast, { type ToastOptions } from "react-hot-toast";

class Toast {
  private toast = reactToast;
  private BASE_DEFAULTS: ToastOptions = {
    position: "bottom-right",
    ariaProps: {
      role: "status",
      "aria-live": "polite",
    },
  };

  public success(message: string, options?: ToastOptions) {
    return this.toast.success(message, { ...this.BASE_DEFAULTS, ...options });
  }
  public error(message: string, options?: ToastOptions) {
    return this.toast.error(message, { ...this.BASE_DEFAULTS, ...options });
  }
  public loading(message: string, options?: ToastOptions) {
    return this.toast.loading(message, { ...this.BASE_DEFAULTS, ...options });
  }

  public promise(promise: Promise<any>, options?: any) {
    return this.toast.promise(promise, {
      ...this.BASE_DEFAULTS,
      ...options,
    });
  }

  public info(message: string, options?: ToastOptions) {
    toast.info(message, { ...this.BASE_DEFAULTS, ...options });
  }
}

export const toast = new Toast();
