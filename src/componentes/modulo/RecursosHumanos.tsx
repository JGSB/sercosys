import { useLocation } from "react-router-dom";
import LayoutModulo from "./LayoutModulo";

export default function RecursosHumanos() {
    const location = useLocation();
    return <LayoutModulo pathname={location.pathname} />;
}
