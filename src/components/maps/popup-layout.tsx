import { ClinicPopup } from "./ClinicPopup";
import { DoctorPopup } from "./DoctorPopup";
import { HospitalPopup } from "./HospitalPopup";

interface PopupLayoutProps {
    type: "clinic" | "doctor" | "hospital";
    data: unknown;
    onClose: () => void;
}

export function renderPopupLayout({ type, data, onClose }: PopupLayoutProps) {
    if (type === "clinic") {
        return <ClinicPopup data={data} onClose={onClose} />;
    }

    if (type === "doctor") {
        return <DoctorPopup data={data} onClose={onClose} />;
    }

    if (type === "hospital") {
        return <HospitalPopup data={data as Parameters<typeof HospitalPopup>[0]["data"]} onClose={onClose} />;
    }

    return null;
}
