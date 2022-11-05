import Preact from 'preact';

interface VectorInputProps {
    dimensions: number;
}

export function VectorInput({ dimensions }: VectorInputProps) {
    return (
        <div className='dialog_vector_group half'>
            {Array.from({ length: dimensions }, (_, i) => (
                <input key={i} type='number' className='dark_bordered focusable_input' />
            ))}
        </div>
    );
}
