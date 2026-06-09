// 어디서든 호출 가능한 전역 알림 트리거
// AlertModal이 이 setter를 등록해두면, axiosInstance 등 React 밖에서도 팝업을 띄울 수 있다

export type AlertType = "success" | "error" | "warning" | "info";

export interface AlertPayload {
    message: string;
    type: AlertType;
    title?: string;
}

let _trigger: ((payload: AlertPayload) => void) | null = null;

export const registerAlertTrigger = (fn: (payload: AlertPayload) => void) => {
    _trigger = fn;
};

export const triggerAlert = (message: string, type: AlertType = "error", title?: string) => {
    _trigger?.({ message, type, title });
};
