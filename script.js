const menuBtn = document.getElementById('menuBtn');
const nav = document.getElementById('nav');
if (menuBtn && nav) {
  menuBtn.addEventListener('click', () => nav.classList.toggle('open'));
}

const prices = {
  newtownabbey: { bfs: 38, bhd: 28, dublin: 150 },
  glengormley: { bfs: 38, bhd: 28, dublin: 150 },
  'belfast city centre': { bfs: 42, bhd: 25, dublin: 150 },
  antrim: { bfs: 25, bhd: 48, dublin: 160 },
  ballyclare: { bfs: 38, bhd: 42, dublin: 170 },
  carrickfergus: { bfs: 44, bhd: 46, dublin: 170 },
  lisburn: { bfs: 35, bhd: 40, dublin: 160 },
  bangor: { bfs: 50, bhd: 52, dublin: 180 }
};

const vehicleRules = {
  saloon: { maxPassengers: 4, maxSuitcases: 3, label: 'Saloon' },
  estate: { maxPassengers: 5, maxSuitcases: 4, label: 'Estate' },
  business: { maxPassengers: 4, maxSuitcases: 3, label: 'Business Class' },
  'seven-seater': { maxPassengers: 6, maxSuitcases: 5, label: '7-Seater', unavailable: true }
};

const quoteForm = document.getElementById('quoteForm');
const quoteButton = document.getElementById('quoteSubmit');
const quoteResult = document.getElementById('quoteResult');
const pickupInput = document.getElementById('pickupInput');
const destinationInput = document.getElementById('destinationInput');
const passengers = document.getElementById('passengers');
const suitcases = document.getElementById('suitcases');
const vehicle = document.getElementById('vehicle');
const bookingForm = document.getElementById('bookingForm');
const pickupDate = document.getElementById('pickupDate');
const pickupTime = document.getElementById('pickupTime');
const returnDate = document.getElementById('returnDate');
const returnTime = document.getElementById('returnTime');

const readStorage = (key, fallback = '') => {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch (error) {
    return fallback;
  }
};

const writeStorage = (key, value) => {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    // Ignore storage issues in unsupported environments.
  }
};

const persistQuoteFields = () => {
  if (!quoteForm) return;
  const fields = ['pickupInput', 'destinationInput', 'airportSelect', 'passengers', 'suitcases', 'vehicle', 'returnTrip', 'childSeat'];
  fields.forEach((id) => {
    const element = document.getElementById(id);
    if (!element) return;
    writeStorage(`airportTaxi.${id}`, element.value);
  });
};

const restoreQuoteFields = () => {
  if (!quoteForm) return;
  const fields = ['pickupInput', 'destinationInput', 'airportSelect', 'passengers', 'suitcases', 'vehicle', 'returnTrip', 'childSeat'];
  fields.forEach((id) => {
    const element = document.getElementById(id);
    if (!element) return;
    const storedValue = readStorage(`airportTaxi.${id}`);
    if (storedValue) {
      element.value = storedValue;
    }
  });
};

const persistBookingFields = () => {
  if (!bookingForm) return;
  const bookingIds = ['pickupDate', 'pickupTime', 'returnDate', 'returnTime', 'bookingName', 'bookingPhone', 'bookingEmail', 'bookingPickup', 'bookingDestination'];
  bookingIds.forEach((id) => {
    const element = document.getElementById(id);
    if (!element) return;
    writeStorage(`airportTaxi.booking.${id}`, element.value);
  });
};

const restoreBookingFields = () => {
  if (!bookingForm) return;
  const bookingIds = ['pickupDate', 'pickupTime', 'returnDate', 'returnTime', 'bookingName', 'bookingPhone', 'bookingEmail', 'bookingPickup', 'bookingDestination'];
  bookingIds.forEach((id) => {
    const element = document.getElementById(id);
    if (!element) return;
    const storedValue = readStorage(`airportTaxi.booking.${id}`);
    if (storedValue) {
      element.value = storedValue;
    }
  });
};

const getNormalizedSuitcaseValue = (value) => {
  if (value === '' || value === null || value === undefined) return null;
  const numericValue = Number(value);
  if (Number.isNaN(numericValue)) return value;
  return numericValue;
};

const getSelectionState = () => {
  const hasPickup = Boolean(pickupInput && pickupInput.value.trim());
  const hasDropoff = Boolean(destinationInput && destinationInput.value.trim());
  const hasPassengers = Boolean(passengers && passengers.value && passengers.value !== '');
  const hasSuitcases = Boolean(suitcases && suitcases.value && suitcases.value !== '');
  return {
    hasPickup,
    hasDropoff,
    hasPassengers,
    hasSuitcases,
    pickupValue: pickupInput ? pickupInput.value.trim() : '',
    dropoffValue: destinationInput ? destinationInput.value.trim() : '',
    passengerCount: hasPassengers ? Number(passengers.value) : null,
    suitcaseCount: hasSuitcases ? getNormalizedSuitcaseValue(suitcases.value) : null
  };
};

const validateVehicleSelection = () => {
  const currentVehicle = vehicle ? vehicle.value : 'saloon';
  const rules = vehicleRules[currentVehicle] || vehicleRules.saloon;
  const { passengerCount, suitcaseCount } = getSelectionState();

  if (!passengerCount || !suitcaseCount && suitcaseCount !== 0) {
    return { valid: true, message: '' };
  }

  if (rules.unavailable) {
    return {
      valid: false,
      message: '7-Seater is unavailable for this booking. Please choose Saloon, Estate or Business Class.'
    };
  }

  if (passengerCount > rules.maxPassengers || (suitcaseCount > rules.maxSuitcases && suitcaseCount !== 5)) {
    return {
      valid: false,
      message: `${rules.label} is unavailable for this passenger and luggage combination. Please review your selections.`
    };
  }

  if (suitcaseCount === 5 && passengerCount > 4) {
    return {
      valid: false,
      message: 'Large luggage quantities may require a larger vehicle or a manual check. Please select another vehicle or contact us.'
    };
  }

  return { valid: true, message: '' };
};

const updateQuoteButtonState = () => {
  const { hasPickup, hasDropoff, hasPassengers, hasSuitcases } = getSelectionState();
  const allRequired = hasPickup && hasDropoff && hasPassengers && hasSuitcases;
  if (!quoteButton) return;
  quoteButton.disabled = !allRequired;

  const vehicleValidation = validateVehicleSelection();
  if (!allRequired) {
    quoteResult.className = 'result error';
    quoteResult.textContent = 'Please select a valid pickup address, destination, passengers and suitcases before requesting a quote.';
    return;
  }

  if (!vehicleValidation.valid) {
    quoteResult.className = 'result error';
    quoteResult.textContent = vehicleValidation.message;
    quoteButton.disabled = true;
    return;
  }

  quoteResult.className = 'result';
  quoteResult.textContent = 'Ready to quote. Choose your route, vehicle and return option to continue.';
};

const getQuoteEstimate = () => {
  const { pickupValue, dropoffValue, passengerCount, suitcaseCount } = getSelectionState();
  const airport = document.getElementById('airportSelect')?.value || 'bfs';
  const selectedVehicle = vehicle ? vehicle.value : 'saloon';
  const returnTrip = document.getElementById('returnTrip')?.value === 'yes';

  const areaKey = pickupValue.toLowerCase();
  const areaPrice = prices[areaKey] || prices.newtownabbey;
  let base = areaPrice[airport] || areaPrice.bfs || 35;

  if (selectedVehicle === 'estate') base += 12;
  if (selectedVehicle === 'business') base += 18;
  if (selectedVehicle === 'seven-seater') base += 28;
  if (returnTrip) base += 18;
  if (passengerCount && passengerCount > 4) base += 5;
  if (suitcaseCount === 5) base += 10;
  if (suitcaseCount === 0) base = Math.max(18, base - 2);
  if (!dropoffValue) {
    return 'Please confirm the drop-off address before getting a quote.';
  }

  return `Estimated fare: £${base} for ${passengerCount} passenger${passengerCount > 1 ? 's' : ''} and ${suitcaseCount === 0 ? 'no' : suitcaseCount} suitcase${suitcaseCount === 1 ? '' : 's'} ${returnTrip ? 'with a return journey' : 'one-way'}.`;
};

if (quoteForm) {
  ['pickupInput', 'destinationInput', 'airportSelect', 'passengers', 'suitcases', 'vehicle', 'returnTrip', 'childSeat'].forEach((id) => {
    const field = document.getElementById(id);
    if (field) {
      field.addEventListener('input', () => {
        persistQuoteFields();
        updateQuoteButtonState();
      });
      field.addEventListener('change', () => {
        persistQuoteFields();
        updateQuoteButtonState();
      });
    }
  });

  quoteForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const { hasPickup, hasDropoff, hasPassengers, hasSuitcases } = getSelectionState();
    const rules = validateVehicleSelection();

    if (!hasPickup || !hasDropoff || !hasPassengers || !hasSuitcases) {
      quoteResult.className = 'result error';
      quoteResult.textContent = 'Please complete pickup, drop-off, passenger and suitcase selections before requesting a quote.';
      return;
    }

    if (!rules.valid) {
      quoteResult.className = 'result error';
      quoteResult.textContent = rules.message;
      return;
    }

    const estimate = getQuoteEstimate();
    quoteResult.className = 'result success';
    quoteResult.textContent = estimate;
    persistQuoteFields();
  });
}

if (bookingForm) {
  ['pickupDate', 'pickupTime', 'returnDate', 'returnTime', 'bookingName', 'bookingPhone', 'bookingEmail', 'bookingPickup', 'bookingDestination'].forEach((id) => {
    const field = document.getElementById(id);
    if (field) {
      field.addEventListener('input', persistBookingFields);
      field.addEventListener('change', persistBookingFields);
    }
  });

  bookingForm.addEventListener('submit', (event) => {
    const dateRequired = !pickupDate?.value || !pickupTime?.value;
    const returnRequired = document.getElementById('returnTrip')?.value === 'yes' && (!returnDate?.value || !returnTime?.value);

    if (dateRequired || returnRequired) {
      event.preventDefault();
      const message = returnRequired ? 'Please complete the return date and time before booking.' : 'Please complete the pickup date and time before booking.';
      const msg = document.createElement('div');
      msg.className = 'result error';
      msg.textContent = message;
      const existing = bookingForm.querySelector('.result-message');
      if (existing) existing.remove();
      msg.classList.add('result-message');
      bookingForm.appendChild(msg);
      bookingForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    persistBookingFields();
  });
}

restoreQuoteFields();
restoreBookingFields();
updateQuoteButtonState();

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, { threshold: 0.15 });

document.querySelectorAll('.reveal').forEach((element) => observer.observe(element));
