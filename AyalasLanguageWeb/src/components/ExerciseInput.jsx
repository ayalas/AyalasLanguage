import { useState, forwardRef, useImperativeHandle, useRef } from 'react';

export const ExerciseInput = forwardRef(({charWidth, checkAnswer}, ref) => {
  const [internalData, setInternalData] = useState("");
  const [errorState, setErrorState] = useState(false);
  const inputRef = useRef(null);

  // This defines what the parent can access via the ref
  useImperativeHandle(ref, () => ({
    getUserAnswer() {
        return internalData;
    },
    setToError() {
        setErrorState(true);
    },
    setFocus() {
      inputRef.current.focus();
    }
  }));

  const onInputChange = function(e) {
    setInternalData(e.target.value);
    setErrorState(false);
  }

  const handleKeyDown = function(e) {
    if (e.key === 'Enter' ) {
      checkAnswer();
    }
  }

  return <input ref={inputRef} type="text" value={internalData} 
            onChange={onInputChange}
            onKeyDown={handleKeyDown}
            className="input-text-placeholder" style={{
            width: `${charWidth}ch`, backgroundColor: errorState? "red": "white"
        }}></input>;
});