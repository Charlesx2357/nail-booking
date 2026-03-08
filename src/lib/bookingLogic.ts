export function hasOverlap(
  newStart: number,
  oldStart: number,
  durationMin: number
): boolean {
  const newEnd = newStart + durationMin;
  const oldEnd = oldStart + durationMin;
  return newStart < oldEnd && oldStart < newEnd;
}

export function buildUnavailableSlots(
  bookingStarts: number[],
  durationMin: number,
  stepMin: number
): Set<number> {
  const unavailable = new Set<number>();

  for (const bookingStart of bookingStarts) {
    const bookingEnd = bookingStart + durationMin;
    for (let t = bookingStart; t < bookingEnd; t += stepMin) {
      unavailable.add(t);
    }
  }

  return unavailable;
}
