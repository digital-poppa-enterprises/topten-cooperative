// HubSpot form configuration and submission settings.
const PORTAL_ID = "149825333";
const FORM_ID = "be8b35d0-8858-45ef-a809-5441d3df9a9c";
const HUBSPOT_ENDPOINT =
  `https://api-eu1.hsforms.com/submissions/v3/integration/submit/${PORTAL_ID}/${FORM_ID}`;
const PHONE_LIBRARY_BASE = "https://cdn.jsdelivr.net/npm/intl-tel-input@29.5.11";
const PHONE_E164_PATTERN = /^\+[1-9]\d{1,14}$/;
const MIN_FORM_TIME_MS = 1500;

// Only initialise the form when a membership form exists on the page.
const form = document.querySelector(".member-form");

if (form) {
  // Cache form controls and status elements used throughout validation and submission.
  const nameInput = form.querySelector("#member-full-name");
  const emailInput = form.querySelector("#member-email");
  const phoneInput = form.querySelector("#member-phone");
  const whatsappInput = form.querySelector("#member-whatsapp");
  const privacyCheckbox = form.querySelector("#agree-privacy");
  const status = form.querySelector("#membership-status-msg");
  const methodRadios = Array.from(form.querySelectorAll('input[name="preferred_contact_method"]'));
  const submitButton = form.querySelector('button[type="submit"]');
  const submitLabel = submitButton.querySelector("[data-submit-label]");
  const honeypot = form.querySelector("#member-website");
  const formStartedAt = Date.now();
  let isSubmitting = false;

  const contactFields = [
    { method: "email", input: emailInput, indicator: form.querySelector('[data-required-indicator="email"]') },
    { method: "phone", input: phoneInput, indicator: form.querySelector('[data-required-indicator="phone"]') },
    { method: "whatsapp", input: whatsappInput, indicator: form.querySelector('[data-required-indicator="whatsapp"]') },
  ];

  const fieldErrors = new Map([
    [nameInput, form.querySelector("#member-full-name-error")],
    [emailInput, form.querySelector("#member-email-error")],
    [phoneInput, form.querySelector("#member-phone-error")],
    [whatsappInput, form.querySelector("#member-whatsapp-error")],
  ]);

  // Load the phone library and utilities only when this module runs.
  function initializePhoneInputs() {
    return import(`${PHONE_LIBRARY_BASE}/dist/js/intlTelInput.mjs`).then(({ default: intlTelInput }) => {
      // Loading the utility module enables country and phone-number validation.
      const utilsPromise = import(`${PHONE_LIBRARY_BASE}/dist/js/utils.js`);
      utilsPromise.catch(() => {});

      const instances = new Map(
        [phoneInput, whatsappInput].map((input) => [
          input,
          intlTelInput(input, {
            initialCountry: "ng",
            separateDialCode: true,
            loadUtils: () => utilsPromise,
          }),
        ]),
      );

      return { instances, utilsPromise };
    });
  }

  const phoneSetupPromise = initializePhoneInputs().catch((error) => {
    console.error("Membership form: phone-number tools could not be loaded.", error);
    return null;
  });

  // Determine whether the customer chose email, phone, or WhatsApp.
  function selectedMethod() {
    return form.querySelector('input[name="preferred_contact_method"]:checked')?.value ?? "";
  }

  // Display helpers keep form status and validation consistent.
  function clearStatus() {
    status.hidden = true;
    status.textContent = "";
    delete status.dataset.state;
  }

  function showStatus(message, state) {
    status.textContent = message;
    status.dataset.state = state;
    status.hidden = false;
  }

  function clearFieldError(input) {
    input.setCustomValidity("");
    input.removeAttribute("aria-invalid");
    const error = fieldErrors.get(input);
    error.textContent = "";
    error.hidden = true;
  }

  function clearAllFieldErrors() {
    fieldErrors.forEach((_, input) => clearFieldError(input));
    form.querySelector("#member-contact-method-error").textContent = "";
    form.querySelector("#member-contact-method-error").hidden = true;
    methodRadios.forEach((radio) => radio.removeAttribute("aria-invalid"));
  }

  function updateRequiredFields() {
    const method = selectedMethod();

    contactFields.forEach(({ method: fieldMethod, input, indicator }) => {
      const required = method === fieldMethod;
      input.required = required;
      input.setAttribute("aria-required", String(required));
      indicator.hidden = !required;
    });
  }

  function setFieldError(input, message, visible) {
    const error = fieldErrors.get(input);
    error.textContent = message;
    error.hidden = false;
    input.setAttribute("aria-invalid", "true");

    if (visible) {
      input.setCustomValidity(message);
      input.focus();
      input.reportValidity();
    } else {
      input.setCustomValidity("");
      methodRadios[0].focus();
    }

    showStatus(message, "error");
  }

  function setSubmitting(submitting) {
    submitButton.disabled = submitting;
    submitButton.setAttribute("aria-busy", String(submitting));
    submitLabel.textContent = submitting ? "SUBMITTING..." : "EXPRESS MEMBERSHIP INTEREST";
  }

  function phoneLibraryNeeded() {
    return contactFields
      .filter(({ method }) => method !== "email")
      .some(({ input, method }) => method === selectedMethod() || input.value.trim() !== "");
  }

  // Validate the form and prepare the submission payload for HubSpot.
  async function collectSubmission() {
    clearAllFieldErrors();

    const name = nameInput.value.trim();
    if (!name) {
      setFieldError(nameInput, "Please enter your full name.", true);
      return null;
    }
    nameInput.value = name;

    const method = selectedMethod();
    if (!["email", "phone", "whatsapp"].includes(method)) {
      const methodError = form.querySelector("#member-contact-method-error");
      methodError.textContent = "Please choose a preferred contact method.";
      methodError.hidden = false;
      methodRadios.forEach((radio) => radio.setAttribute("aria-invalid", "true"));
      methodRadios[0].focus();
      showStatus(methodError.textContent, "error");
      return null;
    }

    if (!privacyCheckbox.checked) {
      showStatus("Please confirm that you have read and agree to the Privacy Policy.", "error");
      privacyCheckbox.focus();
      privacyCheckbox.reportValidity();
      return null;
    }

    const email = emailInput.value.trim();
    emailInput.value = email;
    if (!email && method === "email") {
      setFieldError(emailInput, "Please enter an email address.", true);
      return null;
    }
    if (email && !emailInput.validity.valid) {
      setFieldError(
        emailInput,
        "Enter a valid email address, or clear this field if you prefer another contact method.",
        method === "email",
      );
      return null;
    }

    const selectedPhoneField = contactFields.find(
      ({ method: fieldMethod }) => fieldMethod === method && fieldMethod !== "email",
    );
    if (selectedPhoneField && selectedPhoneField.input.value.trim() === "") {
      setFieldError(
        selectedPhoneField.input,
        `Please enter your ${method === "whatsapp" ? "WhatsApp" : "phone"} number.`,
        true,
      );
      return null;
    }

    // Load phone validation only when a phone number is relevant to this submission.
    let phoneInstances = null;
    if (phoneLibraryNeeded()) {
      const setup = await phoneSetupPromise;
      if (!setup) {
        showStatus("Phone number validation is unavailable right now. Please try again later.", "error");
        return null;
      }

      try {
        await setup.utilsPromise;
      } catch (error) {
        console.error("Membership form: phone-number validation could not be loaded.", error);
        showStatus("Phone number validation is unavailable right now. Please try again later.", "error");
        return null;
      }
      phoneInstances = setup.instances;
    }

    const normalizedPhones = new Map();
    for (const { method: fieldMethod, input } of contactFields.filter(({ method: value }) => value !== "email")) {
      const rawValue = input.value.trim();
      if (!rawValue && fieldMethod === method) {
        setFieldError(input, `Please enter your ${fieldMethod === "whatsapp" ? "WhatsApp" : "phone"} number.`, true);
        return null;
      }
      if (!rawValue) continue;

      const phoneInstance = phoneInstances?.get(input);
      if (!phoneInstance || !phoneInstance.isValidNumber()) {
        const label = fieldMethod === "whatsapp" ? "WhatsApp number" : "phone number";
        const message = `Enter a valid ${label}, or clear this field if you prefer another contact method.`;
        setFieldError(input, message, fieldMethod === method);
        return null;
      }

      const normalized = phoneInstance.getNumber();
      if (!PHONE_E164_PATTERN.test(normalized)) {
        const message = "We could not normalize that phone number. Check the selected country and number.";
        setFieldError(input, message, fieldMethod === method);
        return null;
      }

      normalizedPhones.set(input, normalized);
    }

    // HubSpot expects field values as objects with an object type, field name, and value.
    const fields = [
      { name: "membership_inquiry_name", value: name },
      { name: "preferred_contact_method", value: method },
    ];

    if (email) fields.push({ name: "email", value: email });
    if (normalizedPhones.has(phoneInput)) {
      fields.push({ name: "phone", value: normalizedPhones.get(phoneInput) });
    }
    if (normalizedPhones.has(whatsappInput)) {
      fields.push({ name: "hs_whatsapp_phone_number", value: normalizedPhones.get(whatsappInput) });
    }

    // Include page context when the form is running on a public website, not locally.
    const context = {};
    const hostname = window.location.hostname;
    const isLocalHost =
      hostname === "localhost" ||
      hostname.endsWith(".localhost") ||
      hostname.startsWith("127.") ||
      hostname === "[::1]";
    if (
      (window.location.protocol === "http:" || window.location.protocol === "https:") &&
      !isLocalHost
    ) {
      context.pageUri = `${window.location.origin}${window.location.pathname}`;
      context.pageName = document.title;
    }

    return {
      fields: fields.map(({ name: fieldName, value }) => ({
        objectTypeId: "0-1",
        name: fieldName,
        value,
      })),
      ...(Object.keys(context).length ? { context } : {}),
    };
  }

  async function readHubSpotErrorTypes(response) {
    try {
      const body = await response.json();
      return Array.isArray(body.errors)
        ? body.errors.map((error) => error.errorType).filter((type) => typeof type === "string")
        : [];
    } catch (error) {
      console.warn("Membership form: HubSpot returned an unreadable error response.", {
        status: response.status,
        error,
      });
      return [];
    }
  }

  function rejectionMessage(statusCode, errorTypes) {
    if (statusCode === 429) return "There are too many submissions right now. Please wait a moment and try again.";
    if (errorTypes.includes("FORM_HAS_RECAPTCHA_ENABLED")) {
      return "The form is not available right now. Please contact TOPTEN directly.";
    }
    if (errorTypes.some((type) => type.startsWith("MISSING_") || type === "INVALID_LEGAL_OPTION_FORMAT")) {
      return "The form needs a privacy or consent setting update. Please contact TOPTEN directly.";
    }
    if (errorTypes.includes("REQUIRED_FIELD") || errorTypes.includes("FIELD_NOT_IN_FORM_DEFINITION")) {
      return "The form configuration needs attention. Please contact TOPTEN directly.";
    }
    if (statusCode >= 500) return "The submission service is temporarily unavailable. Please try again later.";
    return "We could not submit your enquiry. Check your details and try again.";
  }

  // Keep required fields, indicators, and status messages in sync with contact-method changes.
  methodRadios.forEach((radio) => {
    radio.addEventListener("change", () => {
      clearAllFieldErrors();
      updateRequiredFields();
      clearStatus();
    });
  });

  fieldErrors.forEach((_, input) => {
    input.addEventListener("input", () => {
      clearFieldError(input);
      clearStatus();
    });
    input.addEventListener("countrychange", () => {
      clearFieldError(input);
      clearStatus();
    });
  });

  privacyCheckbox.addEventListener("change", () => {
    clearStatus();
  });

  updateRequiredFields();

  // Submit the form through HubSpot and prevent duplicate submissions.
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (isSubmitting) return;

    isSubmitting = true;
    setSubmitting(true);
    clearStatus();

    try {
      if (honeypot.value.trim()) {
        showStatus("We could not submit this enquiry. Please try again.", "error");
        return;
      }
      if (Date.now() - formStartedAt < MIN_FORM_TIME_MS) {
        showStatus("Please wait a moment before submitting the form.", "error");
        return;
      }

      let submission;
      try {
        submission = await collectSubmission();
      } catch (error) {
        console.error("Membership form: contact details could not be validated.", error);
        showStatus("We could not validate your contact details. Check them and try again.", "error");
        return;
      }
      if (!submission) return;

      let response;
      try {
        response = await fetch(HUBSPOT_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(submission),
        });
      } catch (error) {
        console.error("Membership form: the HubSpot request failed.", error);
        showStatus("We could not reach the submission service. Your details are still here; please try again.", "error");
        return;
      }

      if (!response.ok) {
        const errorTypes = await readHubSpotErrorTypes(response);
        console.error("Membership form: HubSpot rejected the submission.", {
          status: response.status,
          errorTypes,
        });
        showStatus(rejectionMessage(response.status, errorTypes), "error");
        return;
      }

      showStatus(
        "Thank you. Your membership enquiry has been received, and our team will follow up using your preferred contact method.",
        "success",
      );
    } finally {
      isSubmitting = false;
      setSubmitting(false);
    }
  });

  setSubmitting(false);
}
