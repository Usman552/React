import React from "react";

function Son(props) {
  return (
    <div>
      <h1>My Son</h1>
      <p>{props.children} </p>
    </div>
  );
}

export default Son;
