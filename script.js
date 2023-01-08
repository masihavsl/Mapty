'use strict';

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
const logo = document.querySelector('.logo');
const sortDiBtn = document.querySelector('.distance_sort');
const sortDuBtn = document.querySelector('.duration_sort');

class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);
  constructor(distance, duration, coords) {
    this.distance = distance;
    this.duration = duration;
    this.coords = coords;
  }

  _setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    this.descrtiption = `${this.type[0].toUpperCase()}${this.type.slice(
      1
    )} on ${months[this.date.getMonth()]} ${this.date.getDate()}`;
  }
}

class Running extends Workout {
  type = 'running';

  constructor(distance, duration, coords, cadence) {
    super(distance, duration, coords);
    this.cadence = cadence;
    this.calcPace();
    this._setDescription();
  }

  calcPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}
class Cycling extends Workout {
  type = 'cycling';
  constructor(distance, duration, coords, elevationGain) {
    super(distance, duration, coords);
    this.elavationGain = elevationGain;
    this.calcSpeed();
    this._setDescription();
  }

  calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

class App {
  #map;
  #mapEvent;
  // #Events = [];
  #workouts = [];
  #markers = [];
  #editing = false;
  #workoutEl;
  constructor() {
    this._getPosition();
    this._getlocalStorage();
    logo.addEventListener('click', this._editWorkout.bind(this));
    logo.addEventListener('click', this._newWorkout.bind(this));
    inputType.addEventListener('change', this._toggleElevationField);
    containerWorkouts.addEventListener(
      'click',
      this._workoutPosition.bind(this)
    );
    containerWorkouts.addEventListener('click', this._deleteWorkout.bind(this));
    containerWorkouts.addEventListener('click', this._editWorkout.bind(this));
    sortDiBtn.addEventListener('click', this._sortWorkoutsBy.bind(this));
    sortDuBtn.addEventListener('click', this._sortWorkoutsBy.bind(this));
  }
  _getPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          window.alert('could not get your position');
        }
      );
    }
  }

  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    console.log(`https://www.google.com/maps/@${latitude},${longitude}`);
    const coords = [latitude, longitude];
    this.#map = L.map('map').setView(coords, 13);

    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);
    this.#workouts.forEach(w => this._renderWorkoutMarker(w));
    this.#map.on('click', this._showForm.bind(this));
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _hideForm() {
    inputDistance.value =
      inputCadence.value =
      inputDuration.value =
      inputElevation.value =
        '';
    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'));
  }

  _toggleElevationField() {
    inputElevation.closest('div').classList.toggle('form__row--hidden');
    inputCadence.closest('div').classList.toggle('form__row--hidden');
  }

  _newWorkout(e) {
    if (this.#editing) return;
    e.preventDefault();
    const checkInput = (...input) => input.every(inp => Number.isFinite(inp));
    const allPos = (...input) => input.every(inp => inp > 0);

    const { lat, lng } = this.#mapEvent.latlng;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const type = inputType.value;
    let workout;
    if (type === 'running') {
      const cadence = +inputCadence.value;
      if (!checkInput(distance, duration, cadence))
        return alert('only numbers');
      if (!allPos(distance, duration, cadence))
        return alert('only positive numbers');

      workout = new Running(distance, duration, [lat, lng], cadence);
    }

    if (type === 'cycling') {
      const elavation = +inputElevation.value;
      if (!checkInput(distance, duration, elavation))
        return alert('only numbers');
      if (!allPos(distance, duration)) return alert('only positive numbers');

      workout = new Cycling(distance, duration, [lat, lng], elavation);
    }

    // this.#mapEvent.id = workout.id;
    // this.#Events.push(this.#mapEvent);
    this.#workouts.push(workout);
    this._renderWorkoutMarker(workout);
    this._renderNewWorkout(workout);
    this._hideForm();
    this._setLocalStorage();
  }

  _renderWorkoutMarker(workout) {
    const marker = L.marker(workout.coords);
    this.#markers.push(marker);
    marker
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.descrtiption}`
      )
      .openPopup();
  }

  _renderNewWorkout(workout) {
    let html = `
    <li class="workout workout--${workout.type}" data-id="${workout.id}">
      <h2 class="workout__title">${workout.descrtiption}</h2>
      
      <button class='e'>Edit</button>
      <button class='d'>Delete</button>
      
      <div class="workout__details">
        <span class="workout__icon">${
          workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
        }</span>
        <span class="workout__value">${workout.distance}</span>
        <span class="workout__unit">km</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">⏱</span>
        <span class="workout__value">${workout.duration}</span>
        <span class="workout__unit">min</span>
      </div>
    `;

    if (workout.type === 'running')
      html += `
      <div class="workout__details">
        <span class="workout__icon">⚡️</span>
        <span class="workout__value">${workout.pace.toFixed(1)}</span>
        <span class="workout__unit">min/km</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">🦶🏼</span>
        <span class="workout__value">${workout.cadence}</span>
        <span class="workout__unit">spm</span>
      </div>
    </li>
    `;

    if (workout.type === 'cycling')
      html += `
      <div class="workout__details">
      <span class="workout__icon">⚡️</span>
      <span class="workout__value">${workout.speed.toFixed(1)}</span>
      <span class="workout__unit">km/h</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">⛰</span>
      <span class="workout__value">${workout.elavationGain}</span>
      <span class="workout__unit">m</span>
    </div>
  </li>
    `;

    form.insertAdjacentHTML('afterend', html);
  }

  _workoutPosition(e) {
    if (e.target.type === 'submit') return;
    const workoutEl = e.target.closest('.workout');
    if (!workoutEl) return;
    const workout = this.#workouts.find(w => w.id === workoutEl.dataset.id);
    this.#map.setView(workout.coords, 13, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
  }

  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }

  _getlocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));
    if (!data) return;
    this.#workouts = data;
    this.#workouts.forEach(w => {
      this._renderNewWorkout(w);
    });
  }

  _deleteWorkout(e) {
    if (e.target.className === 'd') {
      const workoutEl = e.target.closest('.workout');
      const index = this.#workouts.indexOf(
        this.#workouts.find(w => workoutEl.dataset.id === w.id)
      );
      this.#markers[index].remove();
      this.#markers.splice(index, 1);
      this.#workouts.splice(index, 1);
      this._setLocalStorage();
      workoutEl.remove();
    }
  }

  reset() {
    localStorage.removeItem('workouts');
    location.reload();
  }

  _editWorkout(e) {
    e.preventDefault();

    //find the exact workout obj index based on el id
    const getIndex = workoutEl =>
      this.#workouts.indexOf(
        this.#workouts.find(w => w.id === workoutEl.dataset.id)
      );
    if (e.target.className === 'e') {
      this.#workoutEl = e.target.closest('.workout');
      const index = getIndex(this.#workoutEl);
      //remove the workout el
      this.#workoutEl.remove();
      //unhide the form
      form.classList.remove('hidden');
      const wk = this.#workouts[index];
      if (wk.type === 'running') {
        // this._toggleElevationField();
        if (inputCadence.closest('div').classList.contains('form__row--hidden'))
          this._toggleElevationField();
        inputType.value = 'running';
        inputDistance.value = wk.distance;
        inputDuration.value = wk.duration;
        inputCadence.value = wk.cadence;
      } else {
        if (
          inputElevation.closest('div').classList.contains('form__row--hidden')
        )
          this._toggleElevationField();
        inputType.value = 'cycling';
        inputDistance.value = wk.distance;
        inputDuration.value = wk.duration;
        inputElevation.value = wk.elavationGain;
      }
      inputDistance.focus();
      this.#editing = true;
    }

    if (e.target.className === 'logo' && this.#editing) {
      //get all the inputs from the form

      const index = getIndex(this.#workoutEl);
      const wk = this.#workouts[index];
      const checkInput = (...input) => input.every(inp => Number.isFinite(inp));
      const allPos = (...input) => input.every(inp => inp > 0);

      const distance = +inputDistance.value;
      const duration = +inputDuration.value;
      const type = inputType.value;
      //edit all the fields of the the obj
      if (type === 'running') {
        const cadence = +inputCadence.value;
        if (!checkInput(distance, duration, cadence))
          return alert('only numbers');
        if (!allPos(distance, duration, cadence))
          return alert('only positive numbers');
        if (wk.type !== type) {
          //change the type
          wk.type = type;
          //delete speed
          delete wk.speed;

          //delete elevation gain
          delete wk.elavationGain;
          //change the description
          wk.descrtiption = wk.descrtiption
            .split(' ')
            .map((el, i) => {
              if (i === 0) el = 'Running';
              return el;
            })
            .join(' ');

          console.log(wk.descrtiption);
        }
        // add pace instead
        wk.pace = duration / distance;
        wk.distance = distance;
        wk.duration = duration;
        wk.cadence = cadence;
        // this.#workouts[index].type = type;
      }

      if (type === 'cycling') {
        const elavation = +inputElevation.value;
        if (!checkInput(distance, duration, elavation))
          return alert('only numbers');
        if (!allPos(distance, duration)) return alert('only positive numbers');
        //change the type to cycling
        //delete cadence
        //delete pace add speed instead
        //change the descripton
        if (wk.type !== type) {
          //change the type
          wk.type = type;
          delete wk.pace;
          delete wk.cadence;
          //change the description
          wk.descrtiption = wk.descrtiption
            .split(' ')
            .map((el, i) => {
              if (i === 0) el = 'Cycling';
              return el;
            })
            .join(' ');
        }
        wk.speed = distance / (duration / 60);
        wk.distance = distance;
        wk.duration = duration;
        wk.elavationGain = elavation;
        // this.#workouts[index].type = type;
      }
      console.log(this.#workouts[index]);

      this._renderNewWorkout(wk);
      //based on workout index find the marker from #markers
      this.#markers[index].closePopup();
      this.#markers[index]
        .addTo(this.#map)
        .bindPopup(
          L.popup({
            maxWidth: 250,
            minWidth: 100,
            autoClose: false,
            closeOnClick: false,
            className: `${wk.type}-popup`,
          })
        )
        .setPopupContent(
          `${wk.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${wk.descrtiption}`
        )
        .openPopup();
      // this.#markers[index].setPopupContent(
      //   `${wk.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${wk.descrtiption}`
      // );
      this._hideForm();
      this._setLocalStorage();
    }
  }

  _sortWorkoutsBy(e) {
    console.log(this.#workouts);
    //loop over the workout elements and sort them inside a new array
    this.#workouts = this.#workouts.sort(
      (w1, w2) => w1[e.target.value] - w2[e.target.value]
    );
    const nodeList = containerWorkouts.querySelectorAll('.workout');
    nodeList.forEach(el => el.remove());
    this.#workouts.forEach(w => this._renderNewWorkout(w));
    //based on the element arg
    //call workoutEl.remove(); on the sorted array elements one by one
    //call _renderNewWorkout(workout) on each el after removing it
  }
}

const app = new App();
