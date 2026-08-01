import { useState } from "react";

function Form() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(formData);
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="form">
        <label htmlFor="name">Name:</label>
        <input type="text" name="name" onChange={handleChange} value={formData.name} />
        <br />
        <label htmlFor="email">Email:</label>
        <input type="email" name="email" onChange={handleChange} value={formData.email} />
        <br />
        <label htmlFor="message">Message:</label>
        <textarea name="message" onChange={handleChange} value={formData.message}></textarea>
        <br />
        <button type="submit">Submit</button>
      </form>
    </div>
  );
}

export default Form;
