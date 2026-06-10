const disableClientValidation = () => {
  // 1. Convert all email inputs to plain text inputs
  const emailInputs = document.querySelectorAll('input[type="email"]');
  emailInputs.forEach(input => {
    input.setAttribute('type', 'text');
  });

  // 2. Remove the required attribute from all inputs
  const requiredInputs = document.querySelectorAll('input[required]');
  requiredInputs.forEach(input => {
    input.removeAttribute('required');
  });
};

export default disableClientValidation;