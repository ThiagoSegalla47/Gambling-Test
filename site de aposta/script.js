const simbolos = [
  { emoji: "🍒", valor: 3 },
  { emoji: "🍋", valor: 5 },
  { emoji: "🍇", valor: 8 },
  { emoji: "❤️‍🔥", valor: 100 },
  { emoji: "🔔", valor: 10 },
  { emoji: "💎", valor: 25 },
  { emoji: "🃏", valor: 250, tipo: "wild" }
];

const apostasValidas = [
  0.4, 0.8, 1.2, 1.6, 2.0, 2.4, 2.8, 3.2, 3.6, 4.0,
  8.0, 12.0, 15.0, 16.0, 20.0, 24.0, 28.0, 30.0,
  32.0, 36.0, 40.0, 45.0, 50.0, 75.0, 100.0,
  120.0, 150.0, 250.0, 500.0
];

let saldo = 100;
let segallaAtivo = false;
let simboloSegalla = null;

function atualizarTela() {
  document.getElementById("saldo").textContent = saldo.toFixed(2);
}

function gerarSimboloAleatorio() {
  if (segallaAtivo) {
    const rand = Math.random();
    if (rand < 0.6) return simboloSegalla;
    if (rand < 0.9) return simbolos.find(s => s.tipo === "wild");
    return { emoji: "", valor: 0 }; // vazio
  }
  const i = Math.floor(Math.random() * simbolos.length);
  return simbolos[i];
}

function girar() {
  limparPremios();
  const aposta = parseFloat(document.getElementById("aposta").value);
  if (isNaN(aposta) || !apostasValidas.includes(aposta)) {
    alert("Aposta inválida! Use os valores permitidos.");
    return;
  }
  if (aposta > saldo) {
    alert("Saldo insuficiente!");
    return;
  }
  saldo -= aposta;

  segallaAtivo = Math.random() < 0.05;
  simboloSegalla = null;
  if (segallaAtivo) {
    const naoWild = simbolos.filter(s => s.tipo !== "wild");
    simboloSegalla = naoWild[Math.floor(Math.random() * naoWild.length)];
  }

  const grid = [];
  for (let i = 0; i < 3; i++) {
    const linha = [];
    for (let j = 0; j < 3; j++) {
      linha.push(gerarSimboloAleatorio());
    }
    grid.push(linha);
  }

  const cells = document.querySelectorAll(".slot-cell");
  grid.flat().forEach((simbolo, index) => {
    const cell = cells[index];
    cell.textContent = simbolo.emoji;
    cell.classList.remove("premiado");
    cell.classList.add("girar");
    setTimeout(() => cell.classList.remove("girar"), 500);
  });

  if (segallaAtivo) {
    const novos = grid.flat().some(s => s.emoji === simboloSegalla.emoji || s.tipo === "wild");
    if (novos) {
      setTimeout(() => repetirSegalla(grid, aposta), 800);
      return;
    }
  }

  finalizarGiro(grid, aposta);
}

function repetirSegalla(anteriores, aposta) {
  const grid = [];
  for (let i = 0; i < 3; i++) {
    const linha = [];
    for (let j = 0; j < 3; j++) {
      const atual = anteriores[i][j];
      if (atual.emoji === simboloSegalla.emoji || atual.tipo === "wild") {
        linha.push(atual);
      } else {
        linha.push(gerarSimboloAleatorio());
      }
    }
    grid.push(linha);
  }

  const cells = document.querySelectorAll(".slot-cell");
  grid.flat().forEach((simbolo, index) => {
    const cell = cells[index];
    cell.textContent = simbolo.emoji;
    cell.classList.remove("premiado");
    cell.classList.add("girar");
    setTimeout(() => cell.classList.remove("girar"), 500);
  });

  const novos = grid.flat().some(s => s.emoji === simboloSegalla.emoji || s.tipo === "wild");
  if (novos) {
    setTimeout(() => repetirSegalla(grid, aposta), 800);
  } else {
    finalizarGiro(grid, aposta);
  }
}

function finalizarGiro(grid, aposta) {
  const ganhadores = verificarCombinacoes(grid);
  let ganho = 0;
  ganhadores.forEach((s) => {
    ganho += (s.valor * aposta) / 6.25;
  });

  const msg = document.getElementById("mensagem");
  if (ganho > 0) {
    const premiouTudo = verificarPremioTotal(grid);
    if (premiouTudo) ganho *= 10;
    saldo += ganho;
    msg.textContent = `🎉 Você ganhou R$ ${ganho.toFixed(2)}!`;
  } else {
    msg.textContent = `🙁 Nada dessa vez...`;
  }
  atualizarTela();
  segallaAtivo = false;
  simboloSegalla = null;
}

function verificarCombinacoes(matriz) {
  const ganhadores = [];
  for (let i = 0; i < 3; i++) {
    const linha = matriz[i];
    const base = linha.find(s => s.tipo !== "wild" && s.emoji !== "");
    if (!base) {
      ganhadores.push({ emoji: "🃏", valor: 250 });
      marcarLinha(i);
    } else if (linha.every(s => s.emoji === base.emoji || s.tipo === "wild")) {
      ganhadores.push(base);
      marcarLinha(i);
    }
  }
  const d1 = [matriz[0][0], matriz[1][1], matriz[2][2]];
  const d2 = [matriz[0][2], matriz[1][1], matriz[2][0]];
  const base1 = d1.find(s => s.tipo !== "wild" && s.emoji !== "");
  const base2 = d2.find(s => s.tipo !== "wild" && s.emoji !== "");
  if (!base1 || d1.every(s => s.emoji === base1.emoji || s.tipo === "wild")) {
    ganhadores.push(base1 || { emoji: "🃏", valor: 250 });
    [0, 4, 8].forEach(i => document.querySelectorAll(".slot-cell")[i].classList.add("premiado"));
  }
  if (!base2 || d2.every(s => s.emoji === base2.emoji || s.tipo === "wild")) {
    ganhadores.push(base2 || { emoji: "🃏", valor: 250 });
    [2, 4, 6].forEach(i => document.querySelectorAll(".slot-cell")[i].classList.add("premiado"));
  }
  return ganhadores;
}

function marcarLinha(linha) {
  for (let j = 0; j < 3; j++) {
    document.querySelectorAll(".slot-cell")[linha * 3 + j].classList.add("premiado");
  }
}

function verificarPremioTotal(grid) {
  return grid.flat().every(s => s.emoji !== "");
}

function limparPremios() {
  document.querySelectorAll(".slot-cell").forEach(c => c.classList.remove("premiado"));
}

atualizarTela();
