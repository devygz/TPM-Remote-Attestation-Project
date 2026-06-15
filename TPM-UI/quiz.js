
const actualAnswers = ["rb", "be", "doner"]

document.querySelector('.btn-send-answers').addEventListener("click", () => {
    let userAnswers = []
    let userAnswersElements = document.querySelectorAll('.quiz-ans');
    userAnswersElements.forEach((obj) => {
        console.log(obj);
        userAnswers.push(obj.value);
    })

    console.log(userAnswers);
    console.log(actualAnswers);
    JSON.stringify(userAnswers) == JSON.stringify(actualAnswers) ? alert("Your answers are correct!") : alert("Your answers are NOT correct.");
})