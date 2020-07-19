'use strict';
// requierment

require('dotenv').config();

// application dependencies ( getting the libraries)

const express = require('express');
const pg = require('pg');
const superagent = require('superagent');
const cors = require('cors');
const methodOverRide = require('method-override') // for lab 13(update and delete)

//main variables( application setup)


const PORT = process.env.PORT || 3030;
const app = express();
const client = new pg.Client(process.env.DATABASE_URL);

//uses



app.use(express.static('./public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(methodOverRide('_method')) // lab 13 (update and delete)
app.use(cors());



//listen to port

client.connect()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Listening on PORT ${PORT}`)
    })
  }) 




//===============Routs definitions =================\\
app.get('/', getDataFromDB); 
app.get('/index',getDataFromDB);
//========================================\\
app.get('/books/:bookID', detailsFun); 
app.post('/books', saveToDB);
app.get('/searches/new', newSearch); // route for the search form page
app.put('/update/:update_book', newUpdate); // end point for PUT req and callback fun to do updating process
app.delete('/delete/:deleted_book',deletBook);

app.get('*', notFoundHandler);




//===============Callback Functions (route handlers)=================\\

// we made suitable call back (route handlers) for each route to make app load quickly and run quick and efficiently


// to render the books from db(my collection) on the homepage (which it is end point is / or /index) anddd we will make the counter on home page


function getDataFromDB(req, res) {
  const SQL = 'SELECT * FROM books;'; // books is the name of table
  return client.query(SQL)
  .then(result => {
    res.render('./pages/index', { data: result.rows }) // path for index.ejs (represent home page) because rendering will be on home page and ejs process will be in index.ejs sooo this path represent always the view that will have rendering process // data is name from us contains all thr table(data) , data will be used when working with ejs process// { data: result.rows } represent the thing that rendering will happen from it which is db sooo this always will represent the db when we want to render from db 
  })
  .catch((err) => {
    errorHandler(err, req, res);
  });

} 

// now we need to make the constructor function

function Book(value) {
  // we didint add the bookshelf here because we will enter its value in the form 
  // el ttabo3 is easy and we made it for most the properties here in lab 11 
  // we made if statement (with new method in one line ) for each property in case the book doesnt contain value for any property,so we determined what the values will be for each property 
  this.image_url = value.volumeInfo.imageLinks.smallThumbnail ? value.volumeInfo.imageLinks.smallThumbnail : 'https://www.freeiconspng.com/uploads/book-icon--icon-search-engine-6.png';
  this.title = value.volumeInfo.title ? value.volumeInfo.title : 'No book with this title';
  this.author = value.volumeInfo.authors[0] ? value.volumeInfo.authors[0] : 'No books for this author';
  this.description = value.volumeInfo.description ? value.volumeInfo.description : '....';
  this.isbn = value.volumeInfo.industryIdentifiers[0].type + value.volumeInfo.industryIdentifiers[0].identifier ? value.volumeInfo.industryIdentifiers[0].type + value.volumeInfo.industryIdentifiers[0].identifier : '000000'; // industryIdentifiers[0] we put it like this because its array , and this array contains 2 properties (type and identifier) , look at json data to undertand it clearly 
}

// then we will go to index.ejs to prepare it at all and do ejs(rendering) process there and making counter



//========================================\\

// we made the (view details ) button in the index.ejs file inside a tag with href (see it )
// now we want to do these things to prepare the details page
//  when we click on button we will move to  details page which contains just one book info. (img , title, author,isbn ,desc,bookshelf) from the db 
// so we want it to return just that record that belongs to book from the db 
// the code for rendering and the shape of the details page  must be in :
//1) views/pages/books/detail --- including justtt <section> who contains ejs syntax and rendering process just 
//2) views/pages/books/show --- including details page at all 

// end point is /books/:id with get request 

// solution 

// function below will do this : 
//**  details page contains just one book info. (img , title, author,isbn ,desc,bookshelf) from the db
//**  so we want it to return just that record that belongs to book from the db
//** end point is /books/:id with get request 



function detailsFun(req, res) {
  let saveId = [req.params.bookID]; // to store the id for specific book
  console.log(saveId); // to check just
  let sql = `SELECT * FROM books WHERE id = $1;` // to retrieve(store) record data for this book in db 
  
  // we add these lines below just in lab 13 (updating process)
  let SQL2 = 'SELECT DISTINCT bookshelf FROM books;'
  let arrOfBookSh=[];
  client.query(SQL2)
    .then(result=>{
      arrOfBookSh=result.rows;
    })
  // end 
  
  
  return client.query(sql, saveId)
  .then(result => {
    res.render('./pages/books/show', { data: result.rows[0]  //./pages/books/show represent the view that will have rendering process(ejs syntax )
  , arrOfBookSh : arrOfBookSh }) // this line just for lab 13 (updating process)
  })                                  // { data: result.rows[0] } represent the db when we want to render from db , and here we put [0] because we want to render specific book details 

  .catch((err) => {
    errorHandler(err, req, res);
  });
  
  
}


// now go to views/pages/books/show to prepare details page and we will include rendering process from  views/pages/books/detail


//========================================\\

// we want to add (select this book ) button in search results page 
// when i click the button the hidden form in the same page will be shown 
// this form (post request for /books)
// this form contains book informations and (enter bookshelf name ) field and (add to database ) button 
// note : you can edit the info. in the form as you like
// after entering the bookshelf name (which is required ) and click on (add to db button)
//the book with it is information(original or the modified) will be added to db (my collection) (so u must see it in the home page which contains my collection)
// then we will redirect to details page which will contain just this book all details(info.) and the route will be (/books/id for this book in db (collection))


//this function for adding book with its informations to db(my collection) 
// end point /books (post request) (given) 
// and making redirect to details page 


function saveToDB(req, res) {
  let ln;
  let title2 = req.body.title;  // for lab 13 (update)

  let { author, title, isbn, image_url, description ,bookShelf} = req.body; // the properties names from the table
  console.log(req.body); // to check just
  let SQL = 'INSERT INTO books (author,title,isbn,image_url,description,bookshelf) VALUES ($1,$2,$3,$4,$5,$6);';
  let safeValues = [author,title,isbn,image_url, description,bookShelf];
  let safetitle =[title2]; // for lab 13 (update)

/* // this commited part will become in lab 13 like below --(for updating process)
  const SQL2 = 'SELECT * FROM books;';
  client.query(SQL2)
  .then(result => {
    ln=result.rows.length;
  })
  return client.query(SQL, safeValues)
  .then(() => {
    res.redirect(`/books/${ln+1}`);
  })
}                         
*/

const SQL2 = 'SELECT * FROM books WHERE title =$1;';
  client.query(SQL, safeValues)
    .then(() => {
    })
  return client.query(SQL2,safetitle)
    .then(result => {
      ln=result.rows[0].id;
      res.redirect(`/books/${ln}`);
    })
    .catch((err) => {
      errorHandler(err, req, res);
    });
}




                                 // we wnt to redirect to details page which have root (/books/ id for the book (id for the book in the db or in my collection)) 
                               // to make redirect we want the root of the page that we want to go to
                                 // the route for details page is changable /books/1 ,/books/2 etc...
                                 // so we did the ln and the above things so we wrote the route like this (/books/${ln+1}) 

     // now we want to go to the search results page which is views/pages/searches/show to :
     // add (select this book ) button
     // adding the form (post request for /books)
     // adding (add to db ) button in the form 
















//===========================================\\


// we want to make a search form with search field to search for book depending on (title or author )
// the form page will have route with end point (/searches/new)
// the route handler must be (post request for /searches)
// the search result page will must be views/pages/searches/show

// solution is the code below and all the code in viws/pages/searches/new



function newSearch (req, res) {
  res.render('./pages/searches/new'); // this path represent the view that will have rendering process(ejs syntax )
}

// route handler for /searches with post request
app.post('/searches', (request, response) => {
  const inputt = request.body.search;
  const radio = request.body.radio;
  let url = `https://www.googleapis.com/books/v1/volumes?q=${inputt}+in${radio}:${inputt}`;
  superagent.get(url)
    .then(bookData => {
      let dataArray = bookData.body.items.map(value => {
        return new Book(value);
      })
      response.render('./pages/searches/show', { data: dataArray }); // path for search results page
    })
    .catch((error) => {
      errorHandler(error, request, response);
    });
})


//========================================\\

// for lab 13

// for updating 

// we will add button (update details) in details page 
// when i click on the button the hidden form will be shown (not working with us)
// the form contains all current book info. in db and exists in edit.ejs as partial and include it in details page
// the bookshelf in the form must be as drop down menu contains all stored bookshelves in db that we use before
// -- to do that we will use (SELECT DISTINCT) 
// -- default value in menu will be the current book bookshelf (this feature sometimes it works and almost the tome not works )
// we will add (update book ) button in the form to submit the form (use method override syntax)
// adding end point for PUT request and make fun to do updating ..
// finally after updating -- we will redirect to details page ..

// solution 
// will be the code below + edit.ejs + detail page(views/pages/books/show) + index.ejs (just one line ) + save to db fun + details fun + 2 lines in the top
 

function newUpdate (req , res){
  //collect
  let { author, title, isbn, image_url, description ,bookshelf} = req.body;
  //update
  let SQL = 'UPDATE books set author=$1,title=$2,isbn=$3,image_url=$4,description=$5,bookshelf=$6 WHERE id=$7 ;';
  //safevalues
  let idParam = req.params.update_book;
  let safeValues = [author,title,isbn,image_url, description,bookshelf,idParam]; // notice that idParam is here
  client.query(SQL,safeValues)
    .then(()=>{
      res.redirect(`/books/${idParam}`); // redirect to details page which route is (/books/id for book)
    })
    .catch((err) => {
      errorHandler(err, req, res);
    });

}


//========================================\\

// for lab 13 

// for the deleting 

// adding (delete book) button in the datails page using method override syntax 
// when i click the button -- the book will removed from the db (my collection)
// adding end point for DELETE request 
// callback fun will run the db and do the deleting process for the book from the table and db 
// then after deleting -- we will redirect to the home page 





// sol in : the code below + details page  +  2 lines in the top



function deletBook(req,res){
  let idParam = req.params.deleted_book;
  let saveID = [idParam];
  let sql = 'DELETE FROM books WHERE id=$1;';
  return client.query(sql,saveID)
    .then(()=>{
      res.redirect('/');
    })
    .catch((err) => {
      errorHandler(err, req, res);
    });

}






//========================================\\
//error handlers


function errorHandler(err, req, res) {
  res.status(500).send(err);
}

//========================================\\


function notFoundHandler(req, res) {
  res.status(404).send('This route does not exist!!'); // or the message ( page not found)
}

//========================================\\


