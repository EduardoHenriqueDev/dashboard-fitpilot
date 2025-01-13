// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCbWio8rerVcId4k3WGDhrKuahOj2t2v9I",
  authDomain: "app-fitfusion.firebaseapp.com",
  projectId: "app-fitfusion",
  storageBucket: "app-fitfusion.appspot.com",
  messagingSenderId: "61815565821",
  appId: "1:61815565821:web:52334725ccd5c6896bbd94",
};

// Inicializar o Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth(); // Obter o auth do Firebase
const db = firebase.firestore(); // Obter o Firestore
const presetsCollection = db.collection("presets");

document.getElementById("addWorkout").addEventListener("click", () => {
  const newWorkoutField = document.createElement("div");
  newWorkoutField.classList.add("workoutField", "mb-3");

  const workoutLabel = document.createElement("label");
  workoutLabel.textContent = "Dia da Semana:";
  workoutLabel.style.fontWeight = "bold";

  const workoutNameInput = document.createElement("input");
  workoutNameInput.type = "text";
  workoutNameInput.classList.add("workoutName", "form-control");
  workoutNameInput.placeholder = "Exemplo: Segunda-Feira";

  const exerciseFields = document.createElement("div");
  exerciseFields.classList.add("exerciseFields", "mt-3");

  newWorkoutField.appendChild(workoutLabel);
  newWorkoutField.appendChild(workoutNameInput);
  newWorkoutField.appendChild(exerciseFields);

  document.getElementById("workoutFields").appendChild(newWorkoutField);
});

document.getElementById("addExerciseGlobal").addEventListener("click", () => {
  const lastWorkoutField = document.querySelector("#workoutFields .workoutField:last-child");

  if (lastWorkoutField) {
    const exerciseFields = lastWorkoutField.querySelector(".exerciseFields");

    const newExerciseField = document.createElement("div");
    newExerciseField.classList.add("exerciseField", "mb-2");

    const exerciseLabel = document.createElement("label");
    exerciseLabel.textContent = "Nome do Exercício:";
    exerciseLabel.style.fontWeight = "bold";

    const newExerciseInput = document.createElement("input");
    newExerciseInput.type = "text";
    newExerciseInput.classList.add("exerciseName", "form-control");
    newExerciseInput.placeholder = "Exemplo: Supino Reto";

    newExerciseField.appendChild(exerciseLabel);
    newExerciseField.appendChild(newExerciseInput);
    exerciseFields.appendChild(newExerciseField);
  } else {
    alert("Adicione um Dia da Semana antes de inserir exercícios.");
  }
});

document.getElementById("savePreset").addEventListener("click", async () => {
  const presetName = document.getElementById("presetName").value.trim();

  const workouts = Array.from(document.querySelectorAll(".workoutField"))
    .map((field) => {
      const name = field.querySelector(".workoutName").value.trim();
      const exercises = Array.from(field.querySelectorAll(".exerciseField .exerciseName"))
        .map((input) => input.value.trim())
        .filter(Boolean);

      return { name, exercises };
    })
    .filter(({ name, exercises }) => name && exercises.length > 0);

  if (presetName && workouts.length > 0) {
    try {
      const user = firebase.auth().currentUser;
      if (!user) {
        alert("Você precisa estar logado para salvar o preset.");
        return;
      }

      await presetsCollection.add({
        name: presetName,
        workouts,
        registeredAcademy: user.email,
      });

      alert("Preset salvo com sucesso!");
      document.getElementById("presetName").value = "";
      document.getElementById("workoutFields").innerHTML = "";
      displayPresets();
    } catch (error) {
      console.error("Erro ao salvar preset:", error);
    }
  } else {
    alert("Preencha o nome do preset e adicione pelo menos um treino com exercícios!");
  }
});

async function displayPresets() {
  const presetListContainer = document.getElementById("presetListContainer");
  const loadingElement = document.getElementById("loading");

  presetListContainer.innerHTML = ""; // Limpar a lista de cards

  // Exibir a mensagem de "carregando" enquanto a lista de presets está sendo carregada
  loadingElement.style.display = "block";

  try {
    const user = firebase.auth().currentUser;
    if (user) {
      const querySnapshot = await presetsCollection
        .where("registeredAcademy", "==", user.email)
        .get();

      // Ocultar a mensagem de "carregando" após os dados serem carregados
      loadingElement.style.display = "none";

      if (querySnapshot.empty) {
        presetListContainer.innerHTML = "<p>Nenhum preset encontrado.</p>";
      } else {
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const card = document.createElement("div");
          card.className = "preset-card";
          const workoutDetails = data.workouts
            .map(
              (workout) =>
                `<li><strong>${workout.name}</strong>: 
                  <ul>${workout.exercises
                  .map((ex) => `<li>${ex}</li>`)
                  .join("")}</ul></li>`
            )
            .join(" ");

          card.innerHTML = `
            <h5 class="preset-title">
              ${data.name}
              <button onclick="deletePreset('${doc.id}')" class="delete-btn" style="color: red; background-color: none; border: none;">
                <i class="fas fa-trash-alt"></i>
              </button>
            </h5>
            <ul>${workoutDetails}</ul>
          `;
          presetListContainer.appendChild(card);
        });
      }
    }
  } catch (error) {
    console.error("Erro ao carregar presets:", error);
    loadingElement.style.display = "none"; // Esconder o loading em caso de erro
  }
}

window.deletePreset = async (id) => {
  if (confirm("Tem certeza que deseja excluir este preset?")) {
    try {
      await presetsCollection.doc(id).delete();
      alert("Preset excluído com sucesso!");
      displayPresets();
    } catch (error) {
      console.error("Erro ao excluir preset:", error);
    }
  }
};

// Monitorar o estado de autenticação
firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    displayPresets();
  } else {
    alert("Você precisa estar logado para visualizar os presets.");
  }
});
