const AppTitle = "CookBook";
const AppVersion = "v2.0";
const Author = "13.a SZOFT";
const Company = "Bajai SZC Türr István Technikum";

const serverUrl = 'http://localhost:3000';

let loggedUser = null;

let title = document.querySelector('title');
let header = document.querySelector('header');
let footer = document.querySelector('footer');

title.innerHTML = AppTitle + ' ' + AppVersion;
header.innerHTML = title.innerHTML;
footer.innerHTML = Company + ' | ' + Author + ' | 2024.';

// render the actual content to the main div 
async function render(view){
    let main = document.querySelector('main');
    main.innerHTML = await (await fetch(`Views/${view}.html`)).text();

    switch(view){
        case 'profile': {
            getMe();
            break;
        }
        case 'users': {
            getUsers();
            break;
        }
        case 'recipes': {
            //getRecipes(); //ezt majd majd getStepDatas
            break;
        }
        case 'statistics': {
            getUserStats();
            getAdminStats(); // feltételhez kell kötni! hogy admin-e a bejelentkezett user
            break;
        }
    }
}
if (localStorage.getItem('cookbook')){
    loggedUser = JSON.parse(localStorage.getItem('cookbook'));
    render('recipes');
}else{
    render('recipes');
}
function renderNavItems(){
    console.log(loggedUser)
    let lgdOutNavItems = document.querySelectorAll('.lgdOut');
    let lgdInNavItems = document.querySelectorAll('.lgdIn');
    let admNavItems = document.querySelectorAll('.lgdAdm');

    // ha nem vagyunk bejelentkezve
    if (loggedUser == null){
        lgdInNavItems.forEach(item =>{
            item.classList.add('d-none');
        });
        lgdOutNavItems.forEach(item => {
            item.classList.remove('d-none');
        });
        admNavItems.forEach(item => {
            item.classList.add('d-none');
        });
        return;
    }

    // ha be vagyunk  jelentkezve és

    // admin vagyunk
    if (loggedUser.role == 'admin'){
        admNavItems.forEach(item => {
            item.classList.remove('d-none');
        });
    }
 
    // user vagyunk
    lgdInNavItems.forEach(item => {
        item.classList.remove('d-none');
    });

    lgdOutNavItems.forEach(item => {
        item.classList.add('d-none');
    });
}

renderNavItems();