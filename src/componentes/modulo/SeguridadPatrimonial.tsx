import { useLocation } from "react-router-dom";
import LayoutModulo from "./LayoutModulo";

export default function SeguridadPatrimonial() {
    const location = useLocation();
    return <LayoutModulo pathname={location.pathname} />;
}
