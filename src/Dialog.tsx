import Preact, { ComponentChildren } from 'preact';
import { useEffect, useRef } from 'preact/hooks';

const style = {
    position: 'absolute',
    display: 'flex',
    top: '100px',
    width: '500px',
    left: '332.5px',
};

interface DialogProps {
    id: string;
    title?: string;
    hidden: boolean;
    draggable: boolean;
    onConfirm(): void;
    onCancel(): void;
    children: ComponentChildren;
}

interface DialogWrapperProps {
    children: ComponentChildren;
}

function DialogWrapper({ children }: DialogWrapperProps) {
    return <>{children}</>;
}

function Dialog({ id, title, children }: DialogProps) {
    const dialogRef = useRef<HTMLDialogElement>(null);

    useEffect(() => {
        if (dialogRef.current == null) return;
        $(dialogRef.current).draggable({
            handle: '.dialog_handle',
            containment: '#page_wrapper',
        });
    }, [dialogRef]);

    return (
        <dialog
            className='dialog draggable ui-draggable'
            id={id}
            style={{
                position: 'absolute',
                display: 'flex',
                top: '50%',
                left: '50%',
            }}
            ref={dialogRef}
        >
            <div className='dialog_handle ui-draggable-handle'>
                <div className='dialog_title'>{title}</div>
            </div>
            <div className='dialog_wrapper'>
                <div className='dialog_content'>{children}</div>
                <div className='dialog_bar button_bar'>
                    <button type='button' className='confirm_btn'>
                        Confirm
                    </button>
                    &nbsp;
                    <button type='button' className='cancel_btn'>
                        Cancel
                    </button>
                </div>
            </div>
            <div class='dialog_close_button'>
                <i class='material-icons'>clear</i>
            </div>
        </dialog>
    );
}
