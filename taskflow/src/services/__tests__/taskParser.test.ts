import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { parseTaskText } from "../taskParser";
import { MOCK_CLIENTS } from "../../data/mockData";
import { addDays, todayStr } from "../../utils/date";

// Wednesday, so "el jueves" is tomorrow and "el lunes" is next week.
const WEDNESDAY = new Date(2026, 8, 23, 9, 0, 0);

const parse = (text: string) => parseTaskText(text, MOCK_CLIENTS);

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(WEDNESDAY);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("clients", () => {
  it("recognises a client by name", () => {
    const { draft, confidence } = parse("Preparar el reel de San Lucas");
    expect(draft.clientId).toBe("san-lucas");
    expect(confidence.client).toBe(true);
    expect(draft.title).toBe("Preparar el reel");
  });

  it("prefers the longest matching name", () => {
    expect(parse("Carrusel de Estilo Campo").draft.clientId).toBe("estilo-campo");
  });

  it("only knows the clients it is given", () => {
    expect(parseTaskText("Llamar a Acme", []).draft.clientId).toBeNull();
  });
});

describe("dates", () => {
  it("resolves hoy / mañana", () => {
    expect(parse("Llamar hoy").draft.dueDate).toBe(todayStr());
    expect(parse("Llamar mañana").draft.dueDate).toBe(addDays(todayStr(), 1));
  });

  it("resolves pasado mañana without matching mañana first", () => {
    expect(parse("Enviar el informe pasado mañana").draft.dueDate).toBe(addDays(todayStr(), 2));
  });

  it("resolves the next occurrence of a weekday", () => {
    expect(parse("El jueves enviar el calendario").draft.dueDate).toBe(addDays(todayStr(), 1));
    expect(parse("El lunes revisar la pauta").draft.dueDate).toBe(addDays(todayStr(), 5));
  });

  it("treats the current weekday as today unless told otherwise", () => {
    expect(parse("El miércoles grabar").draft.dueDate).toBe(todayStr());
    expect(parse("El miércoles que viene grabar").draft.dueDate).toBe(addDays(todayStr(), 7));
  });

  it("understands relative ranges", () => {
    expect(parse("Revisar en 3 días").draft.dueDate).toBe(addDays(todayStr(), 3));
    expect(parse("Mandar la propuesta la semana que viene").draft.dueDate).toBe(
      addDays(todayStr(), 7)
    );
  });

  it("parses explicit dates", () => {
    expect(parse("Cerrar informe el 5 de octubre").draft.dueDate).toBe("2026-10-05");
    expect(parse("Cerrar informe el 5/10").draft.dueDate).toBe("2026-10-05");
  });

  it("rolls an already-past explicit date into next year", () => {
    expect(parse("Renovar el 3 de febrero").draft.dueDate).toBe("2027-02-03");
  });
});

describe("times", () => {
  it.each([
    ["Reel a las 10", "10:00"],
    ["Reel a las 10:30", "10:30"],
    ["Reel 18hs", "18:00"],
    ["Reel a las 9 y media", "09:30"],
    ["Reel a las 9 y cuarto", "09:15"],
    ["Reel al mediodía", "12:00"],
    ["Reel a la una", "13:00"],
    ["Reel a las 4 pm", "16:00"],
  ])("parses %s", (input, expected) => {
    expect(parse(input).draft.dueTime).toBe(expected);
  });

  it("leaves the time empty when none is mentioned", () => {
    const { draft, confidence } = parse("Revisar las piezas");
    expect(draft.dueTime).toBeNull();
    expect(confidence.time).toBe(false);
  });
});

describe("category and priority", () => {
  it("infers a category from keywords", () => {
    expect(parse("Preparar el reel").draft.category).toBe("Contenido");
    expect(parse("Enviar la factura").draft.category).toBe("Administración");
    expect(parse("Coordinar una reunión").draft.category).toBe("Reunión");
  });

  it("falls back to Otro", () => {
    const { draft, confidence } = parse("Pensar algo");
    expect(draft.category).toBe("Otro");
    expect(confidence.category).toBe(false);
  });

  it("picks up urgency words", () => {
    expect(parse("Urgente: mandar las piezas").draft.priority).toBe("high");
    expect(parse("Actualizar el catálogo cuando puedas").draft.priority).toBe("low");
    expect(parse("Actualizar el catálogo").draft.priority).toBe("medium");
  });
});

describe("title", () => {
  it("strips the parts it understood", () => {
    expect(parse("Preparar el reel de San Lucas mañana a las 10").draft.title).toBe(
      "Preparar el reel"
    );
  });

  it("drops filler openings", () => {
    expect(parse("Tengo que enviar el calendario el jueves").draft.title).toBe(
      "Enviar el calendario"
    );
    expect(parse("Acordate de llamar a Kaia").draft.title).toBe("Llamar");
  });

  it("never returns an empty title", () => {
    expect(parse("mañana").draft.title).toBe("Nueva tarea");
  });
});
