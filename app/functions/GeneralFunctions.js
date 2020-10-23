var emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/;

module.exports = {

    isEmailValid : (inputEmails) => {

        let valid = true;
        let errorMsg = "";

        for (const email of inputEmails) {
          let tmpValid = emailRegex.test(email);
          if (!tmpValid) {
            errorMsg = "Invalid email format for: [" + email + "]";
            valid = false;
            break;
          }
          valid &= tmpValid;
        }

        return {
          valid: valid,
          errorMsg: errorMsg,
        };

    },
    errorRespFormatter : (hasError, errorMsg)=>{
      return {
        error: hasError,
        errorMsg: errorMsg,
      }
    }

}