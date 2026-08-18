import { Card, Stack } from '@/ui/components/ui';

/**
 * The one screen that carries explanatory text. Everywhere else the app is a
 * record; a screen that exists to route someone toward help cannot be reduced
 * to a chapter pointer.
 */
export function SafetyScreen() {
  return (
    <Stack>
      <h1>Getting help</h1>

      <Card>
        <Stack tight>
          <h2>If you are in crisis</h2>
          <p>
            If you are thinking about harming yourself, or you are in immediate danger, contact your
            local emergency number or go to your nearest emergency department now.
          </p>
          <p>
            In Norway: Mental Helse 116 123 (open 24 hours). Emergency: 113. Legevakt: 116 117.
          </p>
          <p>
            Elsewhere, findahelpline.com lists free crisis lines by country.
          </p>
        </Stack>
      </Card>

      <Card>
        <Stack tight>
          <h2>Professional help</h2>
          <p>
            A self-help program is not right for everyone, and it is not a substitute for treatment.
            Speak to your doctor if you are very underweight, pregnant, physically unwell, feeling
            persistently depressed, or if things are not improving.
          </p>
          <p>Appendix I of the book sets out how to find professional help.</p>
        </Stack>
      </Card>

      <Card>
        <Stack tight>
          <h2>About this app</h2>
          <p>
            This app is a companion to the book, not a replacement for it. It holds your records —
            it does not diagnose anything, and it does not teach the program. That is what the book
            is for.
          </p>
        </Stack>
      </Card>
    </Stack>
  );
}
