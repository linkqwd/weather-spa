import Component from '../../Framework/Component';
import { CurrentWeather } from './CurrentWeather';
import { WeatherForecastDaily } from './WeatherForecastDaily';
import { WeatherForecastWeekly } from './WeatherForecastWeekly';
import { AppState } from '../../Services';
import { FavouriteBtn } from '../Main/FavouriteLocations/';
import { Utils } from '../../Services';

export default class Main extends Component {
  constructor(host, props) {
    super(host, props);
    AppState.watch('SEARCH-RESULT', this.updateMySelf);
  }

  defineMaxValue(array, objectValue) {
    const decompose = objectValue.split('.');

    return array.reduce((stack, value) => {
      if (stack < value[decompose[0]][decompose[1]]) {
        return value[decompose[0]][decompose[1]];
      } else {
        return stack;
      }
    }, 0);
  }

  defineMinValue(array, objectValue) {
    const decompose = objectValue.split('.');

    return array.reduce((stack, value) => {
      if (stack > value[decompose[0]][decompose[1]]) {
        return value[decompose[0]][decompose[1]];
      } else {
        return stack;
      }
    }, Infinity);
  }

  updateMySelf(state) {
    const currentWeather = {
      city: `${state.currentWeather.name}, ${state.currentWeather.sys.country}`,
      cityId: state.currentWeather.id,
      dt: 'Today',
      tValue: Math.round(state.currentWeather.main.temp),
      tMinValue: Math.round(state.currentWeather.main.temp_min),
      tUnitToggle: true,
      wSpeed: Math.round(state.currentWeather.wind.speed / 0.621371),
      wUnit: 'Km/h',
      wDeg: state.currentWeather.wind.deg,
      pressure: Math.round(state.currentWeather.main.pressure),
      humidity: `${state.currentWeather.main.humidity}%`,
      sunrise: state.currentWeather.sys.sunrise,
      sunset: state.currentWeather.sys.sunset,
      descr: `${state.currentWeather.weather[0].main}, ${
        state.currentWeather.weather[0].description
      }`,
      icon: state.currentWeather.weather[0].icon
    };

    const weeklyForecast = {
      fDay0: {
        currentWeather,
        dayOfWeek: +Utils.getTimeFromEpoch(state.currentWeather.dt, {
          day: '2-digit'
        }),
        data: [],
        maxTemp: '',
        minTemp: '',
        maxWindSpeed: ''
      }
    };

    for (let i = 0, obj = 0; i < state.foreCast.list.length; i++) {
      let day = +Utils.getTimeFromEpoch(state.foreCast.list[i].dt, {
        day: '2-digit'
      });

      if (weeklyForecast[`fDay${obj}`].dayOfWeek === day) {
        weeklyForecast[`fDay${obj}`].data.push(state.foreCast.list[i]);
      } else {
        if (weeklyForecast[`fDay${++obj}`] === undefined) {
          weeklyForecast[`fDay${obj}`] = {
            dayOfWeek: day,
            data: [],
            maxTemp: '',
            minTemp: ''
          };
        }

        weeklyForecast[`fDay${obj}`].data.push(state.foreCast.list[i]);
      }
    }

    Object.keys(weeklyForecast).forEach((key, index) => {
      weeklyForecast[key].maxTemp = Math.round(
        this.defineMaxValue(weeklyForecast[key].data, 'main.temp')
      );
      weeklyForecast[key].minTemp = Math.round(
        this.defineMinValue(weeklyForecast[key].data, 'main.temp')
      );
      weeklyForecast[key].maxWindSpeed = Math.round(
        this.defineMaxValue(weeklyForecast[key].data, 'wind.speed') / 0.621371
      );

      weeklyForecast[key].sunrise = currentWeather.sunrise - 129 * index;
      weeklyForecast[key].sunset = currentWeather.sunset + 111 * index;

      let filteredValue;

      if (weeklyForecast[key].data.length === 1) {
        filteredValue = 0;
      } else if (weeklyForecast[key].data.length === 0) {
        return;
      } else {
        filteredValue = Math.round(weeklyForecast[key].data.length / 2);
      }

      weeklyForecast[key].icon =
        weeklyForecast[key].data[filteredValue].weather[0].icon;

      weeklyForecast[key].descr = `${
        weeklyForecast[key].data[filteredValue].weather[0].main
      }, ${weeklyForecast[key].data[filteredValue].weather[0].description}`;
    });

    currentWeather.sunrise = Utils.getTimeFromEpoch(currentWeather.sunrise);
    currentWeather.sunset = Utils.getTimeFromEpoch(currentWeather.sunset);

    const dailyForecast = {
      fDayX: weeklyForecast.fDay0.data
    };

    this.updateState({
      currentWeather,
      dailyForecast,
      weeklyForecast
    });
  }

  init() {
    ['updateMySelf', 'defineMinValue', 'defineMaxValue'].forEach(
      methodName => (this[methodName] = this[methodName].bind(this))
    );
  }

  render() {
    if (this.state === undefined) return [];

    const foreCast = [
      {
        tag: 'main',
        classList: ['layout__main'],
        children: [
          {
            tag: 'div',
            classList: 'layout__today-wrapper',
            children: [
              {
                tag: 'div',
                classList: 'current-weather__head-wrap',

                children: [
                  {
                    tag: 'h2',
                    classList: 'current-weather__header',
                    content: this.state.currentWeather.city,
                    attributes: [
                      {
                        name: 'id',
                        value: this.state.currentWeather.cityId
                      }
                    ]
                  },
                  {
                    tag: FavouriteBtn,
                    props: {}
                  }
                ]
              },
              {
                tag: CurrentWeather,
                props: this.state.currentWeather
              },
              {
                tag: WeatherForecastDaily,
                props: this.state.dailyForecast
              }
            ]
          },
          {
            tag: WeatherForecastWeekly,
            props: this.state.weeklyForecast
          }
        ]
      }
    ];

    return foreCast;
  }
}
