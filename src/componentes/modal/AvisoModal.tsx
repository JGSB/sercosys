import {
  BsFillQuestionCircleFill,
  BsFillCheckCircleFill,
  BsFillXCircleFill,
  BsFillPersonXFill,
  BsFillPersonCheckFill
} from "react-icons/bs";
import Button from "../../ui/Button";

type BotonesProps = {
    Bcerrar?: boolean;
    Benviar?: boolean;
};

type TxtBotonesProps = {
    Bcerrar?: string;
    Benviar?: string;
};

type AvisoModalProps = {
    show: boolean;
    logo: string;
    colorlogo: string;
    texto: string;
    aligntexto: string;
    sizetexto: string;
    botones: BotonesProps;
    txtbotones: TxtBotonesProps;
    ClickCancel?: () => void;
    ClickConfirm?: () => void;
};
    
export default function AvisoModal({
    show, logo, colorlogo,  texto, aligntexto, sizetexto, botones, txtbotones, ClickCancel, ClickConfirm
}: AvisoModalProps) {
    
    if (!show) return null;

    const IconComponent = {
        BsFillQuestionCircleFill: BsFillQuestionCircleFill,
        BsFillCheckCircleFill: BsFillCheckCircleFill,
        BsFillXCircleFill: BsFillXCircleFill,
        BsFillPersonXFill: BsFillPersonXFill,
        BsFillPersonCheckFill: BsFillPersonCheckFill
    }[logo];
    
    return (
        <>
            <div className="justify-center items-center flex overflow-x-hidden overflow-y-auto fixed inset-0 z-50 outline-none focus:outline-none">
                <div className="relative my-6 mx-2 max-w-full">
                    <div className="border-0 rounded-lg shadow-lg relative flex flex-col w-full outline-none focus:outline-none bg-blue-900">
                        <div className="flex justify-center items-center rounded-t">
                        {IconComponent && (
                            <span className="p-2">
                                <IconComponent className={`${colorlogo} text-4xl`} />
                            </span>
                        )}
                        </div>
                        <div className="relative px-4 py-2 flex-auto text-white">
                        {texto && (
                            <p className={`${aligntexto} ${sizetexto} my-1 font-bold whitespace-pre-line`}>
                                {texto}
                            </p>
                        )}
                        </div>
                        <div className="flex items-center justify-center rounded-b p-2">
                            <div className={`${botones.Bcerrar && botones.Benviar ? 'grid-cols-2' : 'grid-cols-1'} grid gap-20 w-full`}>
                                {botones.Bcerrar && (
                                <Button
                                    type="button"
                                    variant="red900"
                                    className=""
                                    onClick={ClickCancel}
                                >
                                    {txtbotones.Bcerrar}
                                </Button>
                                )}
                                {botones.Benviar && (
                                <Button
                                    type="button"
                                    variant="green900"
                                    className=""
                                    onClick={ClickConfirm}
                                >
                                    {txtbotones.Benviar}
                                </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="opacity-50 fixed inset-0 z-40 bg-blue-900/75"></div>
        </>
    );
}

export const estadoInicialAviso = {
    show: false,
    logo: "",
    colorlogo: "",
    texto: "",
    aligntexto: "",
    sizetexto: "",
    botones: {},
    txtbotones: {},
    ClickCancel: () => {},
    ClickConfirm: () => {},
};