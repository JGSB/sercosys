import { useLocation } from "react-router-dom";
import LayoutModulo from "./LayoutModulo";

export default function Operaciones() {
    const location = useLocation();
    return <LayoutModulo pathname={location.pathname} />;
}
