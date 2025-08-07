import { DateTime } from "@gravity-ui/date-utils";
import { Arrangement } from "app/context/types";

export function formatTime(seconds: number, withHours: boolean = true): string {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = (seconds % 60).toFixed(0);

  if (!withHours) {
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export function getNextArrangementItem(
  now: number,
  arrangements: Arrangement[],
): { time: number; arrangementItem: Arrangement } | null {
  const copy = Array.from(arrangements);
  const sortedArrangement = copy.sort((a, b) => {
    if (a.playingTime.start < b.playingTime.start) {
      return -1;
    }
    return 1;
  });

  const nextArrangement = sortedArrangement.find((item) => {
    const start = item.playingTime.start;
    return start.second() + start.minute() * 60 + start.hour() * 3600 > now;
  });
  if (nextArrangement) {
    return {
      time: getSecondsFromDateTime(nextArrangement.playingTime.start),
      arrangementItem: nextArrangement,
    };
  }
  return null;
}
export function getPrevArrangementItem(
  now: number,
  arrangements: Arrangement[],
): { time: number; arrangementItem: Arrangement } | null {
  const copy = Array.from(arrangements);
  const sortedArrangement = copy.sort((a, b) => {
    if (a.playingTime.start < b.playingTime.start) {
      return -1;
    }
    return 1;
  });

  const prevArrangements: Arrangement[] = [];
  sortedArrangement.find((item) => {
    const start = item.playingTime.start;
    if (start.second() + start.minute() * 60 + start.hour() * 3600 < now) {
      prevArrangements.push(item);
    }
  });

  if (prevArrangements.length > 0) {
    return {
      time: getSecondsFromDateTime(
        prevArrangements[prevArrangements.length - 1].playingTime.start,
      ),
      arrangementItem: prevArrangements[prevArrangements.length - 1],
    };
  }
  return null;
}

export function getSecondsFromDateTime(value: DateTime): number {
  return value.second() + value.minute() * 60 + value.hour() * 3600;
}

export function convertDateTimeToSeconds(dateTime: DateTime): number {
  return getSecondsFromDateTime(dateTime);
}
