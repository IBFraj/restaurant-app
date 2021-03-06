import React, { useState, useEffect, useRef } from "react";
import { BrowserRouter, Route, Switch } from "react-router-dom";
import { Navigation } from "./components/Navigation";
import Home from "./components/Home";
import Order from "./components/Order";
import { Register } from "./components/Register";
import { Login } from "./components/Login";
import { AdminDashboard } from "./components/AdminDashboard";
import EmployeeDashboard from "./components/EmployeeDashboard";
import { FoodMenu } from "./components/FoodMenu";
import { ToastContainer, toast } from "react-toastify";
import { OrderListContext } from "./components/context/Context";
import "react-toastify/dist/ReactToastify.css";
import "./css/App.css";
import socketIOClient from "socket.io-client";

import axios from "axios";



let socket;

function App() {
  const [orderList, setOrderList] = useState(true);
  const [notifyNewOrder, setNotifyNewOrder] = useState(true);
  const [notifyOrderReady, setNotifyOrderReady] = useState("client_id");
  const isFirstRunNewOrder = useRef(true);
  const isFirstRunOrderReady = useRef(true);

  useEffect(() => {
    console.log("CAMBIA");
    getUserCredentials().then((user) => {
      getUserOrdersIds(user.id).then((ids) => {
        // Start a web socket globally
        socket = socketIOClient("/");

        // Inform an employee when a new order has been placed by a client
        socket.on("inform-employees", (data) => {
          if (user.type === "admin" || user.type === "employee")
            toast.success(data.message, {
              position: toast.POSITION.BOTTOM_RIGHT,
              className: "ff-notice-toast",
              autoClose: false,
            });
        });

        // Inform a client when his order has been prepared by an employee
        socket.on("inform-client", (data) => {
          if (
            (user.type === "admin" ||
              user.type === "employee" ||
              user.type === "client") &&
            ids.includes(parseInt(data.id))
          )
            toast.success(data.message, {
              position: toast.POSITION.BOTTOM_RIGHT,
              className: "ff-ready-toast",
              autoClose: false,
            });
        });
      });
    });
  }, [orderList]);

  useEffect(() => {
    if (isFirstRunNewOrder.current) {
      isFirstRunNewOrder.current = false;
      return;
    }

    socket.emit("new-order-placed", { message: "New order has been placed" });
  }, [notifyNewOrder]);

  useEffect(() => {
    if (isFirstRunOrderReady.current) {
      isFirstRunOrderReady.current = false;
      return;
    }

    socket.emit("order-ready", {
      message: "An order has been marked as ready",
      id: notifyOrderReady,
    });
  }, [notifyOrderReady]);

  return (
    <OrderListContext.Provider value={[orderList, setOrderList]}>
      <BrowserRouter>
        <Navigation />
        <div className="container">
          <Switch>
            <Route path="/" component={Home} exact />
            <Route path="/FoodMenu" component={FoodMenu} />
            <Route
              path="/client/order"
              render={(props) => (
                <Order
                  notifyNewOrder={notifyNewOrder}
                  setNotifyNewOrder={setNotifyNewOrder}
                />
              )}
            />
            <Route path="/register" component={Register} />
            <Route path="/login" component={Login} />
            <Route path="/admin/tools" component={AdminDashboard} />
            <Route
              path="/restaurant/tools"
              render={(props) => (
                <EmployeeDashboard
                  notifyOrderReady={notifyOrderReady}
                  setNotifyOrderReady={setNotifyOrderReady}
                />
              )}
            />
          </Switch>
        </div>
       
        
      </BrowserRouter>
    </OrderListContext.Provider>
  );

  async function getUserCredentials() {
    let type = undefined;
    let id = undefined;
    await axios
      .get("/user/credentials")
      .then((res) => {
        type = res.data.type;
        id = res.data.id;
      })
      .catch((err) => {
        console.log(err);
      });

    const user = {
      id: id,
      type: type,
    };
    return user;
    //setCredentials(user);
  }

  async function getUserOrdersIds(id) {
    let ids = [];
    await axios
      .get(`/order/all/${id}`)
      .then((res) => {
        ids = res.data.ids;
      })
      .catch((err) => {
        console.log(err);
      });

    const numericalIds = ids.map((object) => {
      return object.id_order;
    });

    return numericalIds;
    //setOrdersIds(numericalIds);
  }
}

export default App;
