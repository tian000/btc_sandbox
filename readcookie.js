let x = new Promise(resolve => setTimeout(resolve, 500));
x.then(() => console.log(document.cookie));
