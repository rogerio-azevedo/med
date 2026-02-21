import { ClinicPopup } from "./ClinicPopup";
import { DoctorPopup } from "./DoctorPopup";

interface PopupLayoutProps {
    type: "clinic" | "doctor";
    data: any;
    onClose: () => void;
}

export function renderPopupLayout({ type, data, onClose }: PopupLayoutProps) {
    if (type === "clinic") {
        return <ClinicPopup data={data} onClose={onClose} />;
    }

    if (type === "doctor") {
        return <DoctorPopup data={data} onClose={onClose} />;
    }

    return null;
}
