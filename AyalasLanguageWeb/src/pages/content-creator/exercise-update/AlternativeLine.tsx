import { ArchiveRestore, Trash2 } from "lucide-react";
import { useState } from "react";



export function AlternativeLine({ alternative }: { alternative: string }) {
    const [exists, setExists] = useState(true);

    function onDeleteClick(e: React.MouseEvent) {
        e.preventDefault();

        setExists(!exists);
    }

    return (
        <div className="form-row">
            <div className="content-line-part">

                <div className="form-button-cell">
                    <button type="button" className="form-button button-delete-item" onClick={onDeleteClick}>
                        {exists && (
                            <Trash2 className="small-icon" />
                        ) || (
                            <ArchiveRestore className="small-icon" />
                        )}  
                    </button>
                    <label className={ exists? "form-label label-exists" : "form-label label-deleted"}>{alternative}</label>
                </div>
            </div>
        </div>
    );
}