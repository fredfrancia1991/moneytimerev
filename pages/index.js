import { useState } from "react";

// Grille tarifaire (solidaire = RFR < 20 000 €)
const SEUIL_RFR = 20000;
const tarifsCoaching = {
  unique: { standard: 49, solidaire: 29 },
  pack3: { standard: 129, solidaire: 79 },
  pack3mensu: { standard: 45, solidaire: 27 },
  pack12: { standard: 399, solidaire: 299 },
  pack12mensu: { standard: 37, solidaire: 27 },
};

function toMoney(val) {
  return Number(val).toFixed(2);
}

export default function Home() {
  // 0: Accueil, 1: Revenus, 2: Dépenses, 3: Epargne, 4: RFR, 5: Analyse
  const [step, setStep] = useState(0);
  const [revenus, setRevenus] = useState([{ description: "", montant: "" }]);
  const [depenses, setDepenses] = useState([
    { description: "", montant: "", categorie: "Besoins" }
  ]);
  const [epargneStock, setEpargneStock] = useState("");
  const [rfr, setRfr] = useState(""); // champ pour RFR
  const [refusRfr, setRefusRfr] = useState(false);

  // Analyse et packs sélectionnés
  const [result, setResult] = useState(null);
  const [choixPack, setChoixPack] = useState("unique"); // unique | pack3 | pack12
  const [choixPaiement, setChoixPaiement] = useState("complet"); // complet | mensuel

  const addRevenu = () => setRevenus([...revenus, { description: "", montant: "" }]);
  const removeRevenu = (i) => setRevenus(revenus.filter((_, idx) => idx !== i));
  const updateRevenu = (i, field, value) => {
    const arr = [...revenus];
    arr[i][field] = value;
    setRevenus(arr);
  };

  const addDepense = () => setDepenses([...depenses, { description: "", montant: "", categorie: "Besoins" }]);
  const removeDepense = (i) => setDepenses(depenses.filter((_, idx) => idx !== i));
  const updateDepense = (i, field, value) => {
    const arr = [...depenses];
    arr[i][field] = value;
    setDepenses(arr);
  };

  const validerRevenus = (e) => {
    e.preventDefault();
    if (revenus.every(r => r.montant && !isNaN(r.montant))) {
      setStep(2);
    }
  };

  const validerDepenses = (e) => {
    e.preventDefault();
    setStep(3);
  };

  const validerEpargneStock = (e) => {
    e.preventDefault();
    setStep(4);
  };

  const validerRFR = (e) => {
    e.preventDefault();
    setStep(5);
    setTimeout(() => {
      setResult(makeAnalyse());
    }, 0);
  };

  // Calcul de l’analyse au step 5
  function makeAnalyse() {
    const totalRevenu = revenus.reduce((sum, r) => sum + Number(r.montant || 0), 0);
    let b = 0, l = 0, ep = 0;
    depenses.forEach(d => {
      const val = Math.abs(Number(d.montant || 0));
      if (d.categorie === "Besoins") b += val;
      if (d.categorie === "Loisirs") l += val;
      if (d.categorie === "Épargne") ep += val;
    });

    const totalDep = b + l + ep;
    const reste = totalRevenu - totalDep;
    const pb = totalRevenu ? ((b / totalRevenu) * 100) : 0;
    const pl = totalRevenu ? ((l / totalRevenu) * 100) : 0;
    const pe = totalRevenu ? ((ep / totalRevenu) * 100) : 0;

    // Précaution (3,6,9,12 mois) : basé sur "Besoins" du mois
    const prec3 = b * 3, prec6 = b * 6, prec9 = b * 9, prec12 = b * 12;

    // Niveau de précaution atteint
    let niveauPrecaution = "";
    const stock = Number(epargneStock || 0);
    if (stock < prec3) {
      niveauPrecaution = "🚩 Votre épargne est inférieure à 3 mois de dépenses essentielles. Il est conseillé de renforcer progressivement votre matelas de sécurité.";
    } else if (stock < prec6) {
      niveauPrecaution = "✔️ Vous avez au moins 3 mois d’épargne de précaution, c’est le socle recommandé. En viser 6 est l’idéal pour parer la majorité des imprévus.";
    } else if (stock < prec9) {
      niveauPrecaution = "🟢 Vous avez entre 6 et 9 mois d’épargne, vous êtes dans une zone très confortable. Attention à ne pas “trop” épargner par rapport à vos projets de vie.";
    } else if (stock < prec12) {
      niveauPrecaution = "🟢 Plus de 9 mois de besoins en épargne : c’est excellent. Mais n’oubliez pas d’utiliser votre épargne pour vos projets ou vos envies.";
    } else {
      niveauPrecaution = "🟢 Plus de 12 mois d’épargne : c’est largement supérieur à la recommandation classique ! Pensez à dynamiser votre épargne ou à investir selon vos objectifs.";
    }

    // Profils et conseils personnalisés
    let profil = "", conseil = "", conseilSupp = "";

    if (reste < 0) {
      profil = "Alerte : Budget négatif";
      conseil = "Votre budget de ce mois est en déséquilibre : vos dépenses dépassent vos revenus. Pas d’inquiétude, il existe des solutions pour reprendre la main : un accompagnement personnalisé peut vous aider à sortir du rouge.";
    } else {
      if (pb > 50) conseilSupp += "Optimiser vos dépenses, revoir certains tarifs ou le coût de vos achats peut vous donner plus de marge. ";
      if (pl < 10) conseilSupp += "Vous pourriez peut-être vous faire davantage plaisir, tout en gardant un budget équilibré. ";
      if (pe < 10) conseilSupp += "Commencer à épargner, même de petits montants, fait toute la différence sur le long terme. ";

      if (pe >= 10) {
        profil = "En bonne voie";
        conseil += "Bravo pour votre gestion ! ";
      } else {
        profil = "Peut mieux faire";
        conseil += "Vous avez un potentiel d’épargne. ";
      }
      conseil += conseilSupp.trim();
      conseil += "Un coaching personnalisé peut vous aider à équilibrer vos postes et à progresser plus vite.";
    }

    // Récupération solidaire pour l’affichage coaching
    const estSolidaire = (!refusRfr && rfr && Number(rfr) < SEUIL_RFR);
    return {
      totalRevenu, besoins: b, loisirs: l, epargne: ep, totalDep, reste,
      pb, pl, pe, profil, conseil,
      prec3, prec6, prec9, prec12,
      epargneStock: stock, niveauPrecaution,
      rfr, refusRfr, estSolidaire
    };
  }

  const resetAll = () => {
    setStep(0);
    setRevenus([{ description: "", montant: "" }]);
    setDepenses([{ description: "", montant: "", categorie: "Besoins" }]);
    setEpargneStock("");
    setRfr("");
    setRefusRfr(false);
    setResult(null);
    setChoixPack("unique");
    setChoixPaiement("complet");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100 px-2">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8 space-y-6 border border-slate-200">
        {/* Step 0 - Accueil */}
        {step === 0 && (
          <>
            <h1 className="text-4xl font-extrabold text-center text-blue-900 mb-4 tracking-tight drop-shadow">
              moneytimerev
            </h1>
            <p className="text-center text-lg text-gray-800 mb-6 font-medium">
              Rentrez vos revenus, vos dépenses, votre épargne et votre revenu fiscal de référence pour un diagnostic personnalisé et un coaching adapté à vos moyens.
            </p>
            <button
              className="bg-blue-700 text-white px-8 py-6 rounded-2xl text-xl font-semibold w-full hover:bg-blue-900 transition drop-shadow"
              onClick={() => setStep(1)}
            >
              Commencer la saisie
            </button>
          </>
        )}

        {/* Step 1 - Saisie des revenus */}
        {step === 1 && (
          <form onSubmit={validerRevenus} className="space-y-6">
            <h2 className="text-2xl font-bold text-center text-blue-900">Vos revenus du mois</h2>
            <p className="text-center text-gray-700 mb-2">Ajoutez tous vos revenus du mois (salaire, prestations, aides…)</p>
            {revenus.map((rev, i) => (
              <div key={i} className="flex gap-2 mb-1">
                <input
                  type="text"
                  placeholder="Description"
                  className="w-1/2 border border-blue-400 rounded-lg px-3 py-2 bg-gray-100 placeholder-gray-600 text-gray-900"
                  value={rev.description}
                  onChange={e => updateRevenu(i, "description", e.target.value)}
                  required
                />
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="Montant €"
                  className="w-1/3 border border-blue-600 rounded-lg px-3 py-2 bg-gray-100 placeholder-gray-600 text-gray-900"
                  value={rev.montant}
                  onChange={e => updateRevenu(i, "montant", e.target.value)}
                  required
                />
                {revenus.length > 1 && (
                  <button type="button"
                    className="text-red-700 font-bold px-2"
                    onClick={() => removeRevenu(i)}
                  >✕</button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addRevenu}
              className="bg-blue-200 text-blue-900 px-4 py-2 rounded-lg font-semibold"
            >
              + Ajouter un revenu
            </button>
            <div className="flex gap-2 mt-4">
              <button
                type="button"
                onClick={resetAll}
                className="bg-gray-500 text-white px-5 py-3 rounded-lg text-lg font-medium"
              >
                Retour
              </button>
              <button
                type="submit"
                className="bg-blue-700 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-blue-900 transition"
              >
                Valider mes revenus
              </button>
            </div>
          </form>
        )}

        {/* Step 2 - Saisie des dépenses */}
        {step === 2 && (
          <form onSubmit={validerDepenses} className="space-y-6">
            <h2 className="text-2xl font-bold text-center text-blue-900">Vos dépenses du mois</h2>
            <p className="text-center text-gray-700 mb-2">Ajoutez toutes vos dépenses du mois, en sélectionnant la catégorie.</p>
            {depenses.map((dep, i) => (
              <div key={i} className="flex gap-2 mb-1">
                <input
                  type="text"
                  placeholder="Description"
                  className="w-1/3 border border-blue-400 rounded-lg px-3 py-2 bg-gray-100 placeholder-gray-600 text-gray-900"
                  value={dep.description}
                  onChange={e => updateDepense(i, "description", e.target.value)}
                  required
                />
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="Montant €"
                  className="w-1/4 border border-blue-600 rounded-lg px-3 py-2 bg-gray-100 placeholder-gray-600 text-gray-900"
                  value={dep.montant}
                  onChange={e => updateDepense(i, "montant", e.target.value)}
                  required
                />
                <select
                  className="w-1/3 border border-blue-600 rounded-lg px-3 py-2 bg-gray-100 text-gray-900"
                  value={dep.categorie}
                  onChange={e => updateDepense(i, "categorie", e.target.value)}
                  required
                >
                  <option value="Besoins">Besoins</option>
                  <option value="Loisirs">Loisirs</option>
                  <option value="Épargne">Épargne</option>
                </select>
                {depenses.length > 1 && (
                  <button type="button"
                    className="text-red-700 font-bold px-2"
                    onClick={() => removeDepense(i)}
                  >✕</button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addDepense}
              className="bg-blue-200 text-blue-900 px-4 py-2 rounded-lg font-semibold"
            >
              + Ajouter une dépense
            </button>
            <div className="flex gap-2 mt-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="bg-gray-500 text-white px-5 py-3 rounded-lg text-lg font-medium"
              >
                Retour
              </button>
              <button
                type="submit"
                className="bg-blue-700 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-blue-900 transition"
              >
                Valider mes dépenses
              </button>
            </div>
          </form>
        )}

        {/* Step 3 - Saisie de l’épargne stock */}
        {step === 3 && (
          <form onSubmit={validerEpargneStock} className="space-y-6">
            <h2 className="text-2xl font-bold text-center text-green-800">Votre épargne disponible</h2>
            <p className="text-center text-gray-700 mb-2">Indiquez le montant de votre épargne de précaution disponible aujourd’hui (livret A, comptes épargne, etc).</p>
            <div className="flex flex-col items-center">
              <input
                type="number"
                min="0"
                step="any"
                placeholder="Montant de votre épargne disponible (€)"
                className="w-2/3 border border-green-600 rounded-lg px-4 py-3 bg-gray-100 placeholder-gray-600 text-gray-900 text-xl text-center"
                value={epargneStock}
                onChange={e => setEpargneStock(e.target.value)}
                required
              />
            </div>
            <div className="flex gap-2 mt-4">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="bg-gray-500 text-white px-5 py-3 rounded-lg text-lg font-medium"
              >
                Retour
              </button>
              <button
                type="submit"
                className="bg-green-700 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-green-900 transition"
              >
                Continuer
              </button>
            </div>
          </form>
        )}

        {/* Step 4 - Saisie RFR */}
        {step === 4 && (
          <form onSubmit={validerRFR} className="space-y-6">
            <h2 className="text-2xl font-bold text-center text-blue-900">Votre revenu fiscal de référence</h2>
            <p className="text-center text-gray-700 mb-2">
              Pour bénéficier du tarif solidaire, vous pouvez indiquer votre revenu fiscal de référence (RFR) figurant sur votre avis d’imposition.<br />
              <span className="text-sm text-gray-500">Vous pouvez refuser : le tarif standard sera appliqué.</span>
            </p>
            <div className="flex flex-col items-center gap-3">
              <input
                type="number"
                min="0"
                step="any"
                placeholder="RFR figurant sur votre avis d’imposition (€)"
                className="w-2/3 border border-blue-600 rounded-lg px-4 py-3 bg-gray-100 placeholder-gray-600 text-gray-900 text-xl text-center"
                value={rfr}
                onChange={e => {
                  setRfr(e.target.value);
                  setRefusRfr(false);
                }}
                disabled={refusRfr}
              />
              <button
                type="button"
                className={`bg-gray-200 px-4 py-2 rounded-xl font-medium border border-blue-500 hover:bg-blue-100 ${refusRfr ? 'opacity-70' : ''}`}
                onClick={() => {
                  setRfr('');
                  setRefusRfr(!refusRfr);
                }}
              >
                {refusRfr ? "Je souhaite renseigner mon RFR" : "Je ne souhaite pas le communiquer"}
              </button>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="bg-gray-500 text-white px-5 py-3 rounded-lg text-lg font-medium"
              >
                Retour
              </button>
              <button
                type="submit"
                className="bg-blue-700 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-blue-900 transition"
              >
                Voir l’analyse
              </button>
            </div>
          </form>
        )}

        {/* Step 5 - Analyse et Coaching */}
        {step === 5 && result && (
          <div className="space-y-6">
            <div className={`text-2xl font-bold text-center mb-2 drop-shadow 
              ${result.reste < 0 ? "text-red-700" : "text-blue-800"}`}>
              Analyse de votre budget
            </div>
            <div className={`rounded-2xl p-6 space-y-2 text-center shadow font-medium text-lg border 
              ${result.reste < 0 ? "bg-red-100 text-red-900 border-red-300" : "bg-yellow-50 text-yellow-900 border-yellow-300"}`}>
              <div>
                <span className="font-bold">Total revenus :</span> {toMoney(result.totalRevenu)} €
              </div>
              <div>
                <span className="font-bold">Total Dépenses :</span> {toMoney(result.totalDep)} €
              </div>
              <div>
                <span className="font-bold">Reste à vivre :</span> {toMoney(result.reste)} €
              </div>
            </div>
            <div className="bg-blue-50 rounded-2xl p-6 space-y-2 text-center shadow font-medium text-lg text-blue-900 border border-blue-200">
              <div className="font-bold mb-1">Répartition de vos revenus :</div>
              <div>
                Besoins : <span className={`font-bold ${result.pb > 50 ? "text-red-600" : ""}`}>{toMoney(result.pb)}%</span>
              </div>
              <div>
                Loisirs : <span className={`font-bold ${result.pl < 10 ? "text-green-800" : result.pl > 30 ? "text-orange-500" : ""}`}>{toMoney(result.pl)}%</span>
              </div>
              <div>
                Épargne : <span className={`font-bold ${result.pe < 10 ? "text-yellow-600" : ""}`}>{toMoney(result.pe)}%</span>
              </div>
            </div>
            {/* Bloc épargne de précaution */}
            <div className="bg-green-50 rounded-2xl p-5 space-y-2 text-center shadow text-green-900 border border-green-200">
              <div className="font-bold mb-1 text-lg">Épargne de précaution recommandée</div>
              <div>Pour faire face à l’imprévu, il est conseillé d’avoir :</div>
              <div>– <span className="font-bold">{toMoney(result.prec3)} €</span> (3 mois de besoins)</div>
              <div>– <span className="font-bold">{toMoney(result.prec6)} €</span> (6 mois de besoins)</div>
              <div>– <span className="font-bold">{toMoney(result.prec9)} €</span> (9 mois de besoins)</div>
              <div>– <span className="font-bold">{toMoney(result.prec12)} €</span> (12 mois de besoins)</div>
              <div className="mt-2">
                <span className={`font-semibold ${result.epargneStock < result.prec3 ? "text-red-700" : result.epargneStock < result.prec6 ? "text-orange-600" : "text-green-800"}`}>
                  Votre épargne disponible : {toMoney(result.epargneStock)} €
                </span>
                <br />
                {result.niveauPrecaution}
              </div>
            </div>
            <div className={`text-center p-4 rounded-xl font-bold text-lg shadow 
              ${result.reste < 0 ? "bg-red-200 text-red-900" : "bg-green-100 text-green-900"}`}>
              <div className="text-xl mb-2">Profil détecté : {result.profil}</div>
              {result.conseil}
            </div>

            {/* Grille tarifaire */}
            <div className="my-8 bg-slate-50 border border-slate-200 rounded-2xl p-5">
              <div className="text-center text-xl font-bold mb-2 text-blue-800">Tarifs coaching budgétaire</div>
              <table className="w-full text-center text-base mb-2">
                <thead>
                  <tr className="border-b">
                    <th className="py-1"></th>
                    <th className="py-1">Standard</th>
                    <th className="py-1">Solidaire<br /><span className="text-xs font-normal">(RFR &lt; 20 000 € ou en difficulté)</span></th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="font-semibold py-1">Séance unique</td>
                    <td>49 €</td>
                    <td>29 €</td>
                  </tr>
                  <tr className="border-b">
                    <td className="font-semibold py-1">Pack 3 mois</td>
                    <td>129 €<br /><span className="text-xs">(ou 3×45 €)</span></td>
                    <td>79 €<br /><span className="text-xs">(ou 3×27 €)</span></td>
                  </tr>
                  <tr>
                    <td className="font-semibold py-1">Pack 12 mois</td>
                    <td>399 €<br /><span className="text-xs">(ou 12×37 €)</span></td>
                    <td>299 €<br /><span className="text-xs">(ou 12×27 €)</span></td>
                  </tr>
                </tbody>
              </table>
              <div className="text-center text-sm text-slate-700 mt-2">
                Le tarif solidaire est accessible à toute personne avec un RFR inférieur à 20 000 € ou rencontrant des difficultés financières, sur simple déclaration. Pas besoin de justificatif, la confiance d’abord.
              </div>
              <div className="text-center text-sm mt-2 text-blue-900">
                <b>Chaque accompagnement comprend :</b> suivi personnalisé, outil de gestion budgétaire offert, échanges mail/WhatsApp.
              </div>
            </div>

            {/* Choix pack et paiement */}
            <div className="flex flex-col gap-2 items-center my-4">
              <div className="font-semibold mb-1">Choisissez votre accompagnement :</div>
              <div className="flex gap-3 mb-2">
                <button
                  className={`px-4 py-2 rounded-xl border font-medium ${choixPack === "unique" ? "bg-blue-700 text-white" : "bg-slate-100 text-blue-900 border-blue-300"}`}
                  onClick={() => setChoixPack("unique")}
                >
                  Séance unique
                </button>
                <button
                  className={`px-4 py-2 rounded-xl border font-medium ${choixPack === "pack3" ? "bg-blue-700 text-white" : "bg-slate-100 text-blue-900 border-blue-300"}`}
                  onClick={() => setChoixPack("pack3")}
                >
                  Pack 3 mois
                </button>
                <button
                  className={`px-4 py-2 rounded-xl border font-medium ${choixPack === "pack12" ? "bg-blue-700 text-white" : "bg-slate-100 text-blue-900 border-blue-300"}`}
                  onClick={() => setChoixPack("pack12")}
                >
                  Pack 12 mois
                </button>
              </div>
              {(choixPack === "pack3" || choixPack === "pack12") && (
                <div className="flex gap-3 mb-2">
                  <button
                    className={`px-3 py-1 rounded-xl border font-medium text-sm ${choixPaiement === "complet" ? "bg-green-700 text-white" : "bg-slate-100 text-green-900 border-green-300"}`}
                    onClick={() => setChoixPaiement("complet")}
                  >
                    Paiement complet
                  </button>
                  <button
                    className={`px-3 py-1 rounded-xl border font-medium text-sm ${choixPaiement === "mensuel" ? "bg-green-700 text-white" : "bg-slate-100 text-green-900 border-green-300"}`}
                    onClick={() => setChoixPaiement("mensuel")}
                  >
                    Paiement mensuel
                  </button>
                </div>
              )}
              <div className="mt-2 text-lg font-semibold text-blue-800">
                {choixPack === "unique" && <>Tarif : <span className="text-blue-900">{result.estSolidaire ? tarifsCoaching.unique.solidaire : tarifsCoaching.unique.standard} €</span></>}
                {choixPack === "pack3" && (choixPaiement === "complet"
                  ? <>Tarif : <span className="text-blue-900">{result.estSolidaire ? tarifsCoaching.pack3.solidaire : tarifsCoaching.pack3.standard} €</span></>
                  : <>Tarif : <span className="text-blue-900">3×{result.estSolidaire ? tarifsCoaching.pack3mensu.solidaire : tarifsCoaching.pack3mensu.standard} €</span></>
                )}
                {choixPack === "pack12" && (choixPaiement === "complet"
                  ? <>Tarif : <span className="text-blue-900">{result.estSolidaire ? tarifsCoaching.pack12.solidaire : tarifsCoaching.pack12.standard} €</span></>
                  : <>Tarif : <span className="text-blue-900">12×{result.estSolidaire ? tarifsCoaching.pack12mensu.solidaire : tarifsCoaching.pack12mensu.standard} €</span></>
                )}
              </div>
            </div>
            {/* Bouton RDV */}
            <div className="flex flex-col gap-2 mt-6">
              <a
                href="https://calendly.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-blue-700 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-blue-900 transition text-center"
              >
                Prendre RDV pour ce coaching
              </a>
            </div>
            <button
              className="bg-blue-700 text-white px-8 py-4 rounded-xl text-lg w-full font-semibold hover:bg-blue-900 transition mt-2"
              onClick={resetAll}
            >
              Refaire une analyse
            </button>
          </div>
        )}
      </div>
      <p className="mt-8 text-xs text-gray-400 text-center">V9 prototype – moneytimerev</p>
    </div>
  );
}
