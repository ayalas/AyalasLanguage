import { Link } from "react-router-dom";
import { X } from "lucide-react";

interface FormHeaderProps
{
    isPublic: boolean;
    title: string;
}

export function FormHeader ({isPublic, title} :FormHeaderProps) {
    return (
        <div className="form-header">
            <div className="form-name"><h1>{title}</h1></div>
            <div className="form-close-row">
                <Link to={isPublic? "/" : "/home"} className="actions-menu-link-button"><X />&nbsp;Exit</Link>
            </div>
        </div>
    );
}