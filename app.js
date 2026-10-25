(() => {
  'use strict';
  const config = window.HALLOWEEN_CONFIG || {};
  const questions = [
    { chapter: 'ВОПРОС ПЕРВЫЙ', lines: ['Вы боитесь', 'умереть в страшных', 'муках???!!!!'], answers: ['Да!!!', 'Нет…'] },
    { chapter: 'ВОПРОС ВТОРОЙ', lines: ['Вы', 'боитес??'], answers: ['Баюс…', 'Не'] }
  ];
  const screen = document.querySelector('#screen');
  const title = document.querySelector('#question-title');
  const chapter = document.querySelector('#chapter');
  const note = document.querySelector('#question-note');
  const answers = document.querySelector('#answers');
  const microcopy = document.querySelector('#microcopy');
  const progress = document.querySelector('.progress');
  const restart = document.querySelector('.restart');
  const motionToggle = document.querySelector('.motion-toggle');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let step = 0;
  let transitioning = false;
  let motionEnabled = !reducedMotion.matches;
  let revealTimers = [];

  function revealAnswers() {
    revealTimers.forEach(clearTimeout);
    revealTimers = [...answers.children].map((button, index) => {
      button.classList.add('waiting');
      if (button.tagName === 'BUTTON') button.disabled = true;
      return setTimeout(() => {
        button.classList.remove('waiting');
        if (button.tagName === 'BUTTON' && !button.classList.contains('pending-link')) button.disabled = false;
      }, 3000 + index * 2000);
    });
  }

  document.querySelectorAll('[data-pulse]').forEach(element => {
    element.style.setProperty('--duration', `${4 + Math.random() * 6}s`);
    element.style.setProperty('--delay', `${-Math.random() * 10}s`);
    element.style.setProperty('--min-scale', `${.90 + Math.random() * .06}`);
    element.style.setProperty('--max-scale', `${1.04 + Math.random() * .08}`);
  });

  function updateMotion() {
    document.body.classList.toggle('motion-off', !motionEnabled);
    motionToggle.setAttribute('aria-pressed', String(motionEnabled));
    motionToggle.querySelector('.motion-label').textContent = motionEnabled ? 'Анимация вкл.' : 'Анимация выкл.';
  }
  motionToggle.addEventListener('click', () => { motionEnabled = !motionEnabled; updateMotion(); });
  reducedMotion.addEventListener('change', event => { motionEnabled = !event.matches; updateMotion(); });
  updateMotion();

  function setLines(element, lines, redLast = false) {
    element.replaceChildren();
    lines.forEach((line, index) => {
      if (index) element.append(document.createElement('br'));
      const part = document.createElement('span');
      part.textContent = line;
      if (redLast && index === lines.length - 1) part.className = 'red-text';
      element.append(part);
    });
  }

  function telegramUrl(value) {
    try {
      const url = new URL(value);
      return url.protocol === 'https:' && ['t.me', 'telegram.me'].includes(url.hostname) && url.pathname.length > 1 ? url.href : null;
    } catch { return null; }
  }

  function render() {
    const final = step === questions.length;
    document.querySelector('.experience').classList.toggle('final', final);
    document.querySelector('.stage').classList.toggle('invitation-stage', final);
    document.querySelector('.experience').classList.toggle('long-question', step === 0);
    progress.setAttribute('aria-label', final ? 'Все вопросы пройдены' : `Вопрос ${step + 1} из ${questions.length}`);
    progress.querySelectorAll('.step').forEach((element, index) => {
      element.classList.toggle('active', !final && index === step);
      element.classList.toggle('complete', index < step);
    });
    answers.replaceChildren();
    document.querySelector('.event-details')?.remove();
    document.querySelector('.invitation-copy')?.remove();
    restart.hidden = step === 0;
    if (!final) {
      const question = questions[step];
      chapter.textContent = question.chapter;
      setLines(title, question.lines, true);
      note.replaceChildren();
      microcopy.textContent = 'ВЫБЕРИ ОТВЕТ. ЕСЛИ ОСМЕЛИШЬСЯ.';
      question.answers.forEach((text, index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `answer${index === 0 ? ' answer-primary' : ''}`;
        button.dataset.answer = index === 0 ? 'yes' : 'no';
        button.append(document.createTextNode(text));
        const arrow = document.createElement('span');
        arrow.textContent = '↗'; arrow.setAttribute('aria-hidden', 'true');
        button.append(arrow); answers.append(button);
      });
      revealAnswers();
      return;
    }
    chapter.textContent = 'ПРИГЛАШЕНИЕ';
    setLines(title, ['Вы нажали', 'не ту кнопку'], true);
    note.replaceChildren();
    const invitation = document.createElement('div');
    invitation.className = 'invitation-copy';
    const invitationLines = [
      'и теперь вам придется прийти на 🎃Хэллоуин Вечеринку🎃',
      `Вот ваш приглашение, приходите пожалуйста ${config.date || '31.10'} в ${config.time || '19:00'}`,
      '🐸🦊💀🎃Вечеринка костюмированная!!!🎃💀🦊🐸',
      'Пожалуйста наденьте костюм, иначе мы будем очень сильно грустить и не дадим вам желе с глазами…. 😔'
    ];
    invitationLines.forEach((text, index) => {
      const paragraph = document.createElement('p');
      paragraph.textContent = text;
      if (index === 2) paragraph.className = 'dresscode';
      invitation.append(paragraph);
    });
    note.after(invitation);
    const details = document.createElement('div');
    details.className = 'event-details';
    [config.location].filter(Boolean).forEach(value => {
      const item = document.createElement('span'); item.textContent = value; details.append(item);
    });
    answers.before(details);
    const url = telegramUrl(config.telegramUrl);
    const cta = document.createElement(url ? 'a' : 'button');
    cta.className = `answer answer-primary${url ? '' : ' pending-link'}`;
    if (url) {
      cta.href = url; cta.target = '_blank'; cta.rel = 'noopener noreferrer';
      cta.textContent = 'В Telegram-группу ↗';
      microcopy.textContent = 'ВСЕ ПОДРОБНОСТИ И СВОИ ЛЮДИ — В ГРУППЕ.';
    } else {
      cta.type = 'button'; cta.disabled = true;
      cta.textContent = 'Telegram · скоро';
      microcopy.textContent = 'Ссылка на Telegram-группу появится здесь позже.';
    }
    answers.append(cta);
    revealAnswers();
  }

  async function goTo(next) {
    if (transitioning) return;
    transitioning = true;
    revealTimers.forEach(clearTimeout);
    answers.querySelectorAll('button').forEach(button => { button.disabled = true; });
    screen.classList.add('leaving');
    const delay = reducedMotion.matches ? 0 : 230;
    await new Promise(resolve => setTimeout(resolve, delay));
    step = next; render();
    screen.classList.remove('leaving');
    screen.classList.add('entering');
    requestAnimationFrame(() => requestAnimationFrame(() => { screen.classList.remove('entering'); }));
    title.focus({ preventScroll: true });
    transitioning = false;
  }
  answers.addEventListener('click', event => {
    const button = event.target.closest('button[data-answer]');
    if (button && !button.disabled && step < questions.length) goTo(step + 1);
  });
  restart.addEventListener('click', () => goTo(0));
  render();
})();
