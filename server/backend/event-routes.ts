///<reference path="types.ts" />

import express from "express";
import { Request, Response } from "express";

// some useful database functions in here:
import { getAllEvents, addNewEvent } from "./database";
import { Event, weeklyRetentionObject } from "../../client/src/models/event";
import { ensureAuthenticated, validateMiddleware } from "./helpers";

import {
  shortIdValidation,
  searchValidation,
  userFieldsValidator,
  isUserValidator,
} from "./validators";
const router = express.Router();

function formatDateToString(dateInMilisec: number): string {
  const date: Date = new Date(dateInMilisec);
  const dd: string = date.getDate().toString().padStart(2, "0");
  const mm: string = (date.getMonth() + 1).toString().padStart(2, "0");
  const yyyy: string = date.getFullYear().toString();
  return `${dd}/${mm}/${yyyy}`;
}

function getMilisecFromString(dateString: string): number {
  const newDateString: string = `${dateString.slice(3, 5)}/${dateString.slice(
    0,
    2
  )}/${dateString.slice(6)}`;
  const date: Date = new Date(newDateString);
  return date.getTime();
}

function milisecAtMidnight(dateInMilisec: number): number {
  const date: Date = new Date(dateInMilisec);
  return date.setHours(0, 0, 0, 0);
}

// Routes

export interface Filter {
  sorting: string;
  type: string;
  browser: string;
  search: string;
  offset: number;
}

router.get("/all", (req: Request, res: Response) => {
  const allEvents: Event[] = getAllEvents();
  res.json(allEvents);
});

router.get("/all-filtered", (req: Request, res: Response) => {
  const filterParams: Filter = {
    sorting: req.query.sorting || "+date",
    type: req.query.type,
    browser: req.query.browser,
    search: req.query.search,
    offset: req.query.offset,
  };
  console.log(filterParams);
  // const filteredEvents: Event[] = db
  //   .get("events")
  //   .orderBy("date", params.sorting[0] === "+" ? "desc" : "asc")
  //   .filter(params.type && { name: params.type })
  //   .filter(params.browser && { browser: params.browser })
  //   .slice(0, params.offset)
  //   .value();

  let filteredEvents: Event[] = getAllEvents();

  // if(filterParams.sorting === '-date') {

  // }else
  if (filterParams.search) {
    const regex: RegExp = new RegExp(filterParams.search, "i");
    filteredEvents = filteredEvents.filter((event: Event) =>
      Object.values(event).some((value) => regex.test(value.toString()))
    );
  }
  if (filterParams.type) {
    filteredEvents = filteredEvents.filter((event: Event) => event.name === filterParams.type);
  }
  if (filterParams.browser) {
    filteredEvents = filteredEvents.filter(
      (event: Event) => event.browser === filterParams.browser
    );
  }
  if (filterParams.sorting === "+date") {
    filteredEvents = filteredEvents.sort(
      (event1: Event, event2: Event): number => event1.date - event2.date
    );
  } else {
    filteredEvents = filteredEvents.sort(
      (event1: Event, event2: Event): number => event2.date - event1.date
    );
  }
  if (filterParams.offset) {
    filteredEvents = filteredEvents.slice(0, filterParams.offset);
  }

  // if (filterParams.browser) {
  //   console.log(filterParams.browser);
  //   console.log(filteredEvents);
  // }
  res.json({ events: filteredEvents, more: filterParams.offset ? true : false });
});

router.get("/by-days/:offset", (req: Request, res: Response) => {
  const offset: number = +req.params.offset;
  const today: number = new Date().getTime();
  const latestDay: number = new Date(today - offset * 24 * 60 * 60 * 1000).setHours(
    23,
    59,
    59,
    999
  );
  const weekBefore: number = new Date(latestDay - 6 * 24 * 60 * 60 * 1000).setHours(0, 0, 0, 0);

  interface sessionCountPerDay {
    date: string;
    count: number;
  }
  const allEvents: Event[] = getAllEvents();
  const relevantEvents: Event[] = allEvents.filter((event: Event, i: number, arr: Event[]) => {
    if (
      event.date >= weekBefore &&
      event.date < latestDay
      // arr.findIndex((e: Event) => e.session_id === event.session_id) === i
    ) {
      return true;
    }
  });
  let datesCountArr: sessionCountPerDay[] = [];
  relevantEvents.forEach((event: Event) => {
    const dateString: string = formatDateToString(event.date);
    const dayIndex: number = datesCountArr.findIndex(
      (dayCount: sessionCountPerDay) => dayCount.date === dateString
    );
    if (dayIndex !== -1) {
      datesCountArr[dayIndex].count += 1;
    } else {
      datesCountArr.push({ date: dateString, count: 1 });
    }
  });
  console.log(getMilisecFromString(datesCountArr[0].date));
  datesCountArr = datesCountArr.sort(
    (day1: sessionCountPerDay, day2: sessionCountPerDay) =>
      getMilisecFromString(day1.date) - getMilisecFromString(day2.date)
  );

  res.json(datesCountArr);
});

router.get("/by-hours/:offset", (req: Request, res: Response) => {
  const offset: number = +req.params.offset;
  const today: number = new Date().setHours(0, 0, 0, 0);
  const choosenDay: number = new Date(today - offset * 24 * 60 * 60 * 1000).getTime();
  const endOfDay: number = new Date(choosenDay).setHours(23, 59, 59, 999);

  interface sessionCountPerhour {
    hour: string;
    count: number;
  }
  const allEvents: Event[] = getAllEvents();
  const relevantEvents: Event[] = allEvents.filter((event: Event, i: number, arr: Event[]) => {
    if (
      event.date >= choosenDay &&
      event.date <= endOfDay
      // arr.findIndex((e: Event) => e.session_id === event.session_id) === i
    ) {
      return true;
    }
  });
  let HourCountArr: sessionCountPerhour[] = [];
  for (let i = 0; i < 24; i++) {
    HourCountArr.push({ hour: `${i.toString().padStart(2, "0")}:00`, count: 0 });
  }
  relevantEvents.forEach((event: Event) => {
    const hourIndex: number = new Date(event.date).getHours();
    HourCountArr[hourIndex].count += 1;
  });
  HourCountArr = HourCountArr.sort(
    (hour1: sessionCountPerhour, hour2: sessionCountPerhour) =>
      parseInt(hour1.hour) - parseInt(hour2.hour)
  );

  res.send(HourCountArr);
});

// router.get("/today", (req: Request, res: Response) => {
//   res.send("/today");
// });

// router.get("/week", (req: Request, res: Response) => {
//   res.send("/week");
// });

router.get("/retention", (req: Request, res: Response) => {
  const dayZero: number = new Date(+req.query.dayZero).setHours(0, 0, 0, 0);
  const weekInMilisec: number = 604800000; // 7*24*60*60*1000
  const now: number = new Date().getTime();

  const allEvents: Event[] = getAllEvents();

  let signUpEvents: Event[] = allEvents.filter(
    (event: Event) => event.name === "signup" && event.date >= dayZero
  );
  signUpEvents = signUpEvents.sort((event1: Event, event2: Event) => event1.date - event2.date);

  let loginEvents: Event[] = allEvents.filter(
    (event: Event) => event.name === "login" && event.date >= dayZero
  );
  loginEvents = loginEvents.sort((event1: Event, event2: Event) => event1.date - event2.date);

  const weekStarts: number[] = [];
  for (let i: number = dayZero; i < now; i += weekInMilisec) {
    if (i > 1603314000000 && i <= 1603918800000) i += 60 * 60 * 1000;
    weekStarts.push(i);
  }
  weekStarts.push(now);
  console.log(weekStarts);

  const registeredIdsEachWeek: string[][] = []; // array of strings arrays representing each week new usersId
  const loginsEachWeek: string[][] = []; // array of strings arrays representing each week login users id

  for (let i = 0; i < weekStarts.length - 1; i++) {
    const weeklyRegisteredId: string[] = signUpEvents
      .filter((event: Event) => event.date >= weekStarts[i] && event.date < weekStarts[i + 1])
      .map((event: Event) => event.distinct_user_id);
    registeredIdsEachWeek.push(weeklyRegisteredId);

    if (i >= 1) {
      const weeklyLoginEventsIds: string[] = loginEvents
        .filter((event: Event) => event.date >= weekStarts[i] && event.date < weekStarts[i + 1])
        .map((event: Event) => event.distinct_user_id)
        .filter((id: string, i: number, arr: string[]) => arr.indexOf(id) === i);
      loginsEachWeek.push(weeklyLoginEventsIds);
    }
  }
  console.log(registeredIdsEachWeek);
  console.log(loginsEachWeek);

  const retentionArrays: number[][] = registeredIdsEachWeek.map(
    (registeredIds: string[], i: number) => {
      const weeklyRetentionArray: number[] = [100];
      for (let j = i; j < loginsEachWeek.length; j++) {
        const numOfLogins: number = loginsEachWeek[j].filter((id: string) => {
          return registeredIds.includes(id);
        }).length;
        console.log(i, j, numOfLogins, registeredIds.length);
        weeklyRetentionArray.push(Math.round((numOfLogins / registeredIds.length) * 100));
      }
      return weeklyRetentionArray;
    }
  );
  const retentionInfoArray: weeklyRetentionObject[] = [];
  for (let i = 0; i < weekStarts.length - 1; i++) {
    const weekObj: weeklyRetentionObject = {
      registrationWeek: i + 1,
      newUsers: registeredIdsEachWeek[i].length,
      start: new Date(weekStarts[i]).toLocaleDateString(),
      end: new Date(weekStarts[i + 1] - 1000).toLocaleDateString(),
      weeklyRetention: retentionArrays[i],
    };
    retentionInfoArray.push(weekObj);
  }

  res.send(retentionInfoArray);
});

router.get("/:eventId", (req: Request, res: Response) => {
  const events: Event[] = getAllEvents();
  const event: Event = events.find((event: Event) => event._id === req.params.eventId)!;
  res.send(event);
});

router.post("/", (req: Request, res: Response) => {
  const newEvent: Event = req.body;
  addNewEvent(newEvent);
  res.send("Event logged");
});

// router.get("/chart/os/:time", (req: Request, res: Response) => {
//   res.send("/chart/os/:time");
// });

// router.get("/chart/pageview/:time", (req: Request, res: Response) => {
//   res.send("/chart/pageview/:time");
// });

// router.get("/chart/timeonurl/:time", (req: Request, res: Response) => {
//   res.send("/chart/timeonurl/:time");
// });

// router.get("/chart/geolocation/:time", (req: Request, res: Response) => {
//   res.send("/chart/geolocation/:time");
// });

export default router;
