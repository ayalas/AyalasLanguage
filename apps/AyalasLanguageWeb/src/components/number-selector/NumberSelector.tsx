import { useState, useMemo } from 'react';
import './NumberSelector.css';

interface NumberSelectorProps {
    min: number;
    max: number;
    defaultValue?: number;
    onChange?: (value: number) => void;
}

export function NumberSelector({ min, max, defaultValue, onChange }: NumberSelectorProps) {
    const [selected, setSelected] = useState<number | null>(defaultValue ?? null);

    // Generate the array of numbers between min and max
    const numbers = useMemo(() => {
        const range = [];
        for (let i = min; i <= max; i++) {
            range.push(i);
        }
        return range;
    }, [min, max]);

    const handleSelect = (num: number) => {
        setSelected(num);
        if (onChange) {
            onChange(num);
        }
    };

    return (
        <div className="number-selector-container">
            {numbers.map((num) => (
                <button
                    key={num}
                    type="button"
                    className={`number-button ${selected === num ? 'selected' : ''}`}
                    onClick={() => handleSelect(num)}
                    aria-pressed={selected === num}
                >
                    {num}
                </button>
            ))}
        </div>
    );
}