// Sua configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCbWio8rerVcId4k3WGDhrKuahOj2t2v9I",
  authDomain: "app-fitfusion.firebaseapp.com",
  projectId: "app-fitfusion",
  storageBucket: "app-fitfusion.appspot.com",
  messagingSenderId: "61815565821",
  appId: "1:61815565821:web:52334725ccd5c6896bbd94",
};

// Inicializa o Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/9.21.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  where,
  addDoc,
} from "https://www.gstatic.com/firebasejs/9.21.0/firebase-firestore.js";

// Inicializando o app Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Função para obter o nome do usuário logado no Firebase
async function getUsername(user) {
  if (user) {
    const userUid = user.uid; // Usando o UID do usuário
    console.log("Buscando usuário no Firestore por UID:", userUid); // Log de depuração

    // Acessando o Firestore para pegar o nome do usuário
    const userDocRef = doc(db, "academias", userUid); // Acessando o documento pelo UID
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      console.log("Documento encontrado:", userDocSnap.data()); // Log de depuração
      const userData = userDocSnap.data();

      // Verificando se o campo 'name' está presente no documento
      if (userData && userData.name) {
        console.log("Nome encontrado:", userData.name); // Log de depuração
        return userData.name;
      } else {
        console.log("Campo 'name' não encontrado no documento do usuário");
        return "Nome não encontrado";
      }
    } else {
      console.log(
        "Documento não encontrado no Firestore para o UID: ",
        userUid
      );
      return "Usuário não encontrado no Firestore";
    }
  } else {
    console.log("Usuário não autenticado");
    return "Usuário não autenticado";
  }
}

// Função para atualizar a saudação
async function updateGreeting(user) {
  const greetingMessage = document.getElementById("greeting-message");

  if (user) {
    const username = await getUsername(user); // Obtendo nome do Firestore
    console.log("Atualizando saudação com nome:", username); // Log de depuração
    greetingMessage.innerHTML = `
      <h3>
        <span class="username">${username}!</span> Pronto para transformar sua academia hoje?
      </h3>`; // Estilização aplicada apenas à parte verde
  } else {
    greetingMessage.innerHTML = `<h3>Usuário não autenticado</h3>`; // Caso o usuário não esteja logado
  }
}

// Função para verificar o estado de autenticação
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("Usuário logado:", user.email); // Log do email do usuário autenticado
    updateGreeting(user); // Atualizar a saudação com o nome do usuário
    getDocumentCount(user); // Contar os documentos de usuários e academias
  } else {
    console.log("Nenhum usuário logado"); // Caso o usuário não esteja logado
    // Redireciona para a página de login
    window.location.href = "../pages/login.html";
  }
});


// Função para contar os documentos nas coleções "users" e "academias"
async function getDocumentCount(user) {
  const userEmail = user.email;
  const userCollectionRef = collection(db, "users");

  try {
    // Filtrando usuários e academias com base no campo 'registeredAcademy'
    const userQuery = query(userCollectionRef, where("registeredAcademy", "==", userEmail));

    // Obtendo os documentos filtrados
    const userSnapshot = await getDocs(userQuery);

    // Atualizando o número de documentos no frontend
    document.getElementById("user-count-number").textContent = userSnapshot.size; // Contagem de usuários

  } catch (error) {
    console.error("Erro ao contar documentos:", error);
  }
}

getDocumentCount();

// Função para contar os documentos na coleção "academias"
async function getAcademyDocumentCount() {
  const academyCollectionRef = collection(db, "academias");

  try {
    const academySnapshot = await getDocs(academyCollectionRef);

    // Atualizando o número de documentos no frontend
    document.getElementById("academy-count-number").textContent =
      academySnapshot.size; // Atualiza o número de academias
  } catch (error) {
    console.error("Erro ao contar documentos de academias:", error);
  }
}

// Atualiza a saudação quando o estado de autenticação mudar
onAuthStateChanged(auth, (user) => {
  console.log("Estado de autenticação mudou. Usuário:", user); // Log de depuração
  if (user) {
    updateGreeting(user); // Exibe a saudação com o nome do usuário logado
  } else {
    // Caso o usuário não esteja logado, exibe uma mensagem padrão
    document.getElementById(
      "greeting-message"
    ).innerHTML = `<h3>Usuário não autenticado</h3>`; // Caso o usuário não esteja logado
  }
});

// Chama a função para contar os documentos logo após carregar a página
window.onload = getDocumentCount;

// Atualiza a saudação a cada 1 hora (3.600.000 milissegundos)
setInterval(() => {
  const user = auth.currentUser;
  console.log("Atualizando saudação após 1 hora. Usuário atual:", user); // Log de depuração
  updateGreeting(user); // Atualiza a saudação mesmo se o estado não mudar
}, 3600000);

// Carregar a sidebar no container
fetch("components/sidebar.html")
  .then((response) => response.text())
  .then((data) => {
    document.getElementById("sidebar-container").innerHTML = data;

    // Após carregar o HTML, inicializar a lógica do Firebase
    initializeSidebar();
  })
  .catch((error) => {
    console.error("Erro ao carregar a sidebar:", error);
  });

function initializeSidebar() {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      try {
        const userId = user.uid;
        const docRef = doc(db, "academias", userId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          const ownerInfoElement = document.getElementById("owner-info");
          if (ownerInfoElement) {
            ownerInfoElement.innerHTML = `
                <p id="owner-name">${data.name}</p>
                <p id="owner-email">${data.ownerEmail}</p>
              `;
          } else {
            console.error("Elemento 'owner-info' não encontrado.");
          }
        } else {
          console.log("Documento não encontrado no Firestore.");
        }
      } catch (error) {
        console.error("Erro ao buscar informações no Firestore:", error);
      }
    } else {
      console.log("Nenhum usuário está logado no momento.");
    }
  });
}

window.logout = function () {
  auth.signOut()
    .then(() => {
      window.location.href = "../pages/login.html";
    })
    .catch((error) => {
      console.error("Erro ao deslogar: ", error);
    });
};

// Array de frases motivacionais
const frasesMotivacionais = [
  "Não é sobre ser o melhor. É sobre ser melhor do que você era ontem.",
  "Dor é temporária, o orgulho é para sempre.",
  "Você não está apenas levantando pesos; está levantando sua vida.",
  "Resultados não vêm do desejo, mas do esforço.",
  "Treine até que seus ídolos se tornem seus rivais.",
  "Todo progresso começa com um passo.",
  "Não pare quando estiver cansado, pare quando tiver terminado.",
  "Dedique-se, porque ninguém mais fará isso por você.",
  "Seu único limite é você mesmo.",
  "O suor de hoje é o brilho de amanhã.",
  "A jornada é difícil, mas a recompensa vale a pena.",
  "Cada repetição te aproxima do seu objetivo.",
  "Transforme sua dor em poder.",
  "Disciplina supera a motivação.",
  "Seja consistente, não perfeito.",
  "Você é mais forte do que pensa.",
  "Grandes mudanças começam com pequenas decisões diárias.",
  "Não espere pela motivação; crie-a.",
  "O impossível é apenas uma opinião.",
  "Faça do treino o seu hábito, não sua obrigação.",
  "Acredite no processo.",
  "Seu corpo aguenta, é a sua mente que precisa ser convencida.",
  "Lembre-se do porquê você começou.",
  "Se fosse fácil, todo mundo faria.",
  "Prove a si mesmo o quão forte você é.",
  "Cada suor derramado conta.",
  "Não conte as repetições. Faça com que cada uma delas conte.",
  "Fortaleça seu corpo e sua mente.",
  "Desafie seus limites.",
  "Resultados não mentem.",
  "O treino é a sua meditação ativa.",
  "O difícil de hoje será o aquecimento de amanhã.",
  "Construa o corpo dos seus sonhos, um dia de cada vez.",
  "Foco, força e fé.",
  "Fracasso não é o oposto de sucesso, é parte dele.",
  "Quem quer, encontra um jeito; quem não quer, encontra uma desculpa.",
  "Se você desistir agora, nunca saberá o que poderia alcançar.",
  "Ser saudável não é um objetivo; é um estilo de vida.",
  "A dor que você sente hoje será a força que sentirá amanhã.",
  "Seja a inspiração que você procura.",
  "Treine porque você ama seu corpo, não porque o odeia.",
  "Você só falha quando para de tentar.",
  "Tenha paciência, os resultados virão.",
  "Você é o criador do seu próprio destino.",
  "Sua mente desistirá antes do seu corpo.",
  "Não compare seu capítulo 1 com o capítulo 20 de outra pessoa.",
  "O suor é o grito da gordura indo embora.",
  "Não perca o foco nos dias difíceis.",
  "Acredite na força que está construindo.",
  "Seja consistente para se tornar excelente.",
  "Quem treina forte, colhe resultados.",
  "Quanto mais você sua no treino, menos sangra na batalha.",
  "Não subestime o poder da constância.",
  "Treinar não é um castigo, é um privilégio.",
  "Levante pesos, eleve sua confiança.",
  "Não é sobre a velocidade, é sobre a persistência.",
  "Transforme esforço em energia positiva.",
  "Tudo o que você precisa está dentro de você.",
  "No treino, como na vida, quem se dedica vence.",
  "Melhore 1% todos os dias.",
  "A força não vem do físico, vem da vontade.",
  "Comemore cada pequeno progresso.",
  "Não espere por milagres; trabalhe por eles.",
  "Você é capaz de muito mais do que imagina.",
  "Erga-se e mostre a força que possui.",
  "Não deixe que o medo limite seus passos.",
  "Foque no que você pode controlar.",
  "Transforme sua meta em rotina.",
  "O maior projeto que você pode trabalhar é você mesmo.",
  "Seja a melhor versão de você, todos os dias.",
];

// Função para exibir uma frase aleatória
function exibirFraseMotivacional() {
  const fraseDoDia =
    frasesMotivacionais[Math.floor(Math.random() * frasesMotivacionais.length)];
  document.getElementById("frase").textContent = fraseDoDia;
}

// Carregar a frase assim que o script for executado
exibirFraseMotivacional();

// Função para verificar se o usuário está logado
function checkUserLogin() {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      console.log("Usuário logado:", user.email);
      getNotifications(user.email);  // Passa o email do usuário logado para a função de notificações
    } else {
      console.error("Erro: Usuário não está logado.");
    }
  });
}

// Função para obter notificações do Firestore com a estrutura especificada
async function getNotifications(userEmail) {
  const notificationsCollectionRef = collection(db, "notifications");

  try {
    // Filtrando as notificações onde registeredAcademy corresponde ao email do usuário logado
    const q = query(
      notificationsCollectionRef,
      where("registeredAcademy", "==", userEmail)
    );

    console.log("Consultando notificações com a query:", q);

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      console.log("Nenhuma notificação encontrada para o usuário:", userEmail);
      renderNotifications([]); // Nenhuma notificação para exibir
    } else {
      const notifications = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      console.log("Notificações obtidas:", notifications); // Verifique o conteúdo das notificações
      renderNotifications(notifications); // Exibe as notificações no frontend
    }
  } catch (error) {
    console.error("Erro ao obter notificações:", error);
  }
}

// Função para renderizar notificações com a estrutura especificada
function renderNotifications(notifications) {
  const notificationContainer = document.getElementById("notification-container");

  if (!notificationContainer) {
    console.error("Erro: Container de notificações não encontrado.");
    return;
  }

  if (notifications.length > 0) {
    console.log("Renderizando notificações:", notifications); // Depuração para ver as notificações a serem renderizadas

    notificationContainer.innerHTML = notifications
      .map(
        (notification) => `
            <div class="notification-item">
              <h4 style="color: black;">${notification.title}</h4>
              ${notification.subtitle
            ? `<strong style="color: #47494a;">${notification.subtitle}</strong>`
            : ""
          }<p>${notification.description}</p>
            </div>
          `
      )
      .join("");
  } else {
    console.log("Exibindo mensagem de 'sem notificações'...");
    notificationContainer.innerHTML = "<p>Você Ainda não Enviou Nenhuma Notificação.</p>";
  }
}

// Chama a função para verificar o login do usuário
checkUserLogin();

// Função para enviar notificação ao Firestore
async function sendNotification(event) {
  event.preventDefault(); // Evita o comportamento padrão do formulário

  // Obter o email do usuário logado
  const user = auth.currentUser;
  if (!user) {
    alert("Usuário não está logado.");
    return;
  }
  const userEmail = user.email; // Obtém o email do usuário logado

  // Obter os valores dos campos do formulário
  const title = document.getElementById("inputTitle").value;
  const subtitle = document.getElementById("inputSubtitle").value;
  const description = document.getElementById("inputDescription").value;

  // Referência para a coleção de notificações no Firestore
  const notificationsCollectionRef = collection(db, "notifications");

  try {
    // Buscar os usuários com o email logado em registeredAcademy (campo string)
    const usersQuerySnapshot = await getDocs(
      query(
        collection(db, "users"),
        where("registeredAcademy", "==", userEmail)
      )
    );

    // Verificar se encontramos documentos
    if (usersQuerySnapshot.empty) {
      console.warn(
        "Nenhum usuário encontrado com o email na registeredAcademy."
      );
    } else {
      // Extrair os emails dos usuários encontrados
      const userEmails = [];
      usersQuerySnapshot.forEach((doc) => {
        const userData = doc.data();
        console.log("Email encontrado:", userData.email); // Log para verificar se está certo
        userEmails.push(userData.email); // Adiciona o email à lista
      });

      // Adiciona o documento de notificação ao Firestore
      await addDoc(notificationsCollectionRef, {
        title: title || "", // Se o campo estiver vazio, define como string vazia
        subtitle: subtitle || "",
        description: description || "",
        userAttribute: userEmails, // Adiciona a lista de emails de usuários
        registeredAcademy: userEmail, // Email do usuário logado
      });

      // Limpar os campos do formulário
      document.getElementById("form-content").reset();

      // Exibir mensagem de sucesso
      alert("Notificação enviada com sucesso!");

      // Atualizar a lista de notificações
      getNotifications();
    }
  } catch (error) {
    console.error("Erro ao enviar notificação:", error);
    alert("Ocorreu um erro ao enviar a notificação. Tente novamente.");
  }
}

// Chame esta função quando o DOM estiver pronto para garantir que o formulário esteja visível
document
  .getElementById("form-content")
  .addEventListener("submit", sendNotification);

// Adicionar evento ao formulário de envio
window.onload = () => {

  getAcademyDocumentCount();
  getDocumentCount(); // Chamada já existente
  getNotifications(); // Chamada para obter notificações

  const form = document.getElementById("form-content");
  form.addEventListener("submit", sendNotification); // Vincula o envio ao Firestore
};

// Atualizar notificações a cada 5 minutos (300.000 milissegundos)
setInterval(() => {
  console.log("Atualizando notificações...");
  getNotifications();
}, 300000);
