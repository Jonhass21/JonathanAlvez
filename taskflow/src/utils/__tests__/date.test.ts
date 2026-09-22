import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import {
  addDays,
  addMonths,
  formatMinutesLabel,
  friendlyDate,
  getMonthGrid,
  getWeekDates,
  minutesUntil,
  todayStr,
} from "../date";

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 8, 23, 9, 0, 0)); // Wed 23 Sep 2026
});

afterEach(() => {
  vi.useRealTimers();
});

describe("addMonths", () => {
  it("steps by calendar month, not 30 days", () => {
    expect(addMonths("2026-01-15", 1)).toBe("2026-02-15");
    expect(addMonths("2026-03-15", -1)).toBe("2026-02-15");
  });

  it("clamps to the last day of a shorter month", () => {
    expect(addMonths("2026-01-31", 1)).toBe("2026-02-28");
    expect(addMonths("2024-01-31", 1)).toBe("2024-02-29");
  });

  it("crosses year boundaries", () => {
    expect(addMonths("2026-12-10", 1)).toBe("2027-01-10");
    expect(addMonths("2026-01-10", -1)).toBe("2025-12-10");
  });
});

describe("getWeekDates", () => {
  it("returns a Monday-first week", () => {
    const week = getWeekDates("2026-09-23");
    expect(week).toHaveLength(7);
    expect(week[0]).toBe("2026-09-21");
    expect(week[6]).toBe("2026-09-27");
  });

  it("puts Sunday at the end of its own week", () => {
    expect(getWeekDates("2026-09-27")[0]).toBe("2026-09-21");
  });
});

describe("getMonthGrid", () => {
  it("covers whole weeks around the month", () => {
    const grid = getMonthGrid("2026-09-15");
    expect(grid.length % 7).toBe(0);
    expect(grid).toContain("2026-09-01");
    expect(grid).toContain("2026-09-30");
  });
});

describe("friendlyDate", () => {
  it("labels near dates in words", () => {
    expect(friendlyDate(todayStr())).toBe("Hoy");
    expect(friendlyDate(addDays(todayStr(), 1))).toBe("Mañana");
    expect(friendlyDate(addDays(todayStr(), 2))).toBe("Viernes");
    expect(friendlyDate(null)).toBe("Sin fecha");
  });

  it("does not shift a day across timezones", () => {
    // Parsed by parts rather than through Date(ISO), which would be UTC.
    expect(friendlyDate("2026-09-23")).toBe("Hoy");
  });
});

describe("minutesUntil", () => {
  it("counts forward and backward from now", () => {
    expect(minutesUntil("2026-09-23", "09:30")).toBe(30);
    expect(minutesUntil("2026-09-23", "08:30")).toBe(-30);
  });
});

describe("formatMinutesLabel", () => {
  it.each([
    [0, "Ahora"],
    [30, "En 30 min"],
    [60, "En 1 h"],
    [95, "En 1 h 35 min"],
  ])("%i → %s", (minutes, expected) => {
    expect(formatMinutesLabel(minutes)).toBe(expected);
  });
});
