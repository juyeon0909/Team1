import React, { useState, useEffect } from "react";
import { Modal, Button } from "react-bootstrap";
import { registerAlertTrigger } from "../utils/alertEvent";
import type { AlertType, AlertPayload } from "../utils/alertEvent";

const TYPE_CONFIG: Record<AlertType, { icon: string; color: string; defaultTitle: string }> = {
    success: { icon: "", color: "#1a9d60", defaultTitle: "완료" },
    error: { icon: "", color: "#dc3545", defaultTitle: "오류" },
    warning: { icon: "", color: "#f59e0b", defaultTitle: "주의" },
    info: { icon: "", color: "#3b82f6", defaultTitle: "안내" },
};

const AlertModal: React.FC = () => {
    const [visible, setVisible] = useState(false);
    const [payload, setPayload] = useState<AlertPayload>({ message: "", type: "info" });

    useEffect(() => {
        registerAlertTrigger((p) => {
            setPayload(p);
            setVisible(true);
        });
    }, []);

    const cfg = TYPE_CONFIG[payload.type];

    return (
        <Modal show={visible} onHide={() => setVisible(false)} centered size="sm">
            <Modal.Body style={{ textAlign: "center", padding: "2rem 1.5rem 1.5rem" }}>
                <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>{cfg.icon}</div>
                <h5 style={{ fontWeight: 700, color: cfg.color, marginBottom: "0.5rem" }}>
                    {payload.title ?? cfg.defaultTitle}
                </h5>
                <p style={{ margin: 0, color: "#374151", whiteSpace: "pre-wrap" }}>{payload.message}</p>
            </Modal.Body>
            <Modal.Footer style={{ justifyContent: "center", borderTop: "none", paddingTop: 0 }}>
                <Button
                    onClick={() => setVisible(false)}
                    style={{ backgroundColor: cfg.color, borderColor: cfg.color, minWidth: "6rem" }}
                >
                    확인
                </Button>
            </Modal.Footer>
        </Modal>
    );
};
/* 커밋 체크 */
export default AlertModal;
